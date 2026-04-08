"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/auth";
import { Decimal, splitEqually } from "@/lib/money";
import { expenseInputSchema } from "@/lib/validators";

export type ExpenseActionState = {
  ok: boolean;
  error?: string;
};

type ParsedFormValues = {
  description: string;
  amount: string;
  currency: string;
  paidByMemberId: string;
  participantIds: string[];
  splitType: "equal" | "custom";
  customShares: Record<string, string>;
  date: string;
};

function parseFormValues(formData: FormData): ParsedFormValues {
  const participantIds = formData.getAll("participantIds").map((v) => String(v));
  const customShares: Record<string, string> = {};
  for (const id of participantIds) {
    const key = `customShare[${id}]`;
    const raw = formData.get(key);
    if (raw !== null) {
      customShares[id] = String(raw);
    }
  }
  return {
    description: String(formData.get("description") ?? ""),
    amount: String(formData.get("amount") ?? ""),
    currency: String(formData.get("currency") ?? ""),
    paidByMemberId: String(formData.get("paidByMemberId") ?? ""),
    participantIds,
    splitType: (String(formData.get("splitType") ?? "equal") as "equal" | "custom"),
    customShares,
    date: String(formData.get("date") ?? ""),
  };
}

/**
 * Given parsed expense input, computes per-participant share amounts in
 * the expense's currency. For equal splits, uses cent-remainder
 * distribution so the sum matches the total exactly.
 */
function computeShares(
  total: Decimal.Value,
  participantIds: string[],
  splitType: "equal" | "custom",
  customShares: Record<string, string>,
): { memberId: string; shareAmount: string }[] {
  if (splitType === "equal") {
    const shares = splitEqually(total, participantIds.length);
    return participantIds.map((id, i) => ({
      memberId: id,
      shareAmount: shares[i].toFixed(2),
    }));
  }
  return participantIds.map((id) => ({
    memberId: id,
    shareAmount: new Decimal(customShares[id]).toFixed(2),
  }));
}

function validateCustomSum(
  total: Decimal.Value,
  shares: { shareAmount: string }[],
): string | null {
  const sum = shares.reduce(
    (acc, s) => acc.plus(new Decimal(s.shareAmount)),
    new Decimal(0),
  );
  if (!sum.equals(new Decimal(total))) {
    return `Custom shares must sum to ${new Decimal(total).toFixed(2)} (got ${sum.toFixed(2)})`;
  }
  return null;
}

export async function addExpenseAction(
  joinCode: string,
  _prev: ExpenseActionState | null,
  formData: FormData,
): Promise<ExpenseActionState> {
  const code = joinCode.toUpperCase();
  const { group } = await requireMember(code);
  const raw = parseFormValues(formData);
  const parsed = expenseInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  // Ensure every participant and the payer belong to this group.
  const memberIdSet = new Set(group.members.map((m) => m.id));
  if (!memberIdSet.has(parsed.data.paidByMemberId)) {
    return { ok: false, error: "Payer is not a member of this group" };
  }
  for (const id of parsed.data.participantIds) {
    if (!memberIdSet.has(id)) {
      return { ok: false, error: "Participant is not a member of this group" };
    }
  }

  const shares = computeShares(
    parsed.data.amount,
    parsed.data.participantIds,
    parsed.data.splitType,
    parsed.data.customShares ?? {},
  );
  if (parsed.data.splitType === "custom") {
    const err = validateCustomSum(parsed.data.amount, shares);
    if (err) return { ok: false, error: err };
  }

  await db.expense.create({
    data: {
      groupId: group.id,
      description: parsed.data.description,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      paidByMemberId: parsed.data.paidByMemberId,
      date: new Date(parsed.data.date),
      splits: {
        create: shares.map((s) => ({
          memberId: s.memberId,
          shareAmount: s.shareAmount,
        })),
      },
    },
  });

  revalidatePath(`/groups/${code}`);
  revalidatePath(`/groups/${code}/balances`);
  redirect(`/groups/${code}`);
}

export async function updateExpenseAction(
  joinCode: string,
  expenseId: string,
  _prev: ExpenseActionState | null,
  formData: FormData,
): Promise<ExpenseActionState> {
  const code = joinCode.toUpperCase();
  const { group } = await requireMember(code);
  const raw = parseFormValues(formData);
  const parsed = expenseInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const existing = await db.expense.findUnique({ where: { id: expenseId } });
  if (!existing || existing.groupId !== group.id) {
    return { ok: false, error: "Expense not found" };
  }

  const memberIdSet = new Set(group.members.map((m) => m.id));
  if (!memberIdSet.has(parsed.data.paidByMemberId)) {
    return { ok: false, error: "Payer is not a member of this group" };
  }
  for (const id of parsed.data.participantIds) {
    if (!memberIdSet.has(id)) {
      return { ok: false, error: "Participant is not a member of this group" };
    }
  }

  const shares = computeShares(
    parsed.data.amount,
    parsed.data.participantIds,
    parsed.data.splitType,
    parsed.data.customShares ?? {},
  );
  if (parsed.data.splitType === "custom") {
    const err = validateCustomSum(parsed.data.amount, shares);
    if (err) return { ok: false, error: err };
  }

  await db.$transaction([
    db.expenseSplit.deleteMany({ where: { expenseId } }),
    db.expense.update({
      where: { id: expenseId },
      data: {
        description: parsed.data.description,
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        paidByMemberId: parsed.data.paidByMemberId,
        date: new Date(parsed.data.date),
        splits: {
          create: shares.map((s) => ({
            memberId: s.memberId,
            shareAmount: s.shareAmount,
          })),
        },
      },
    }),
  ]);

  revalidatePath(`/groups/${code}`);
  revalidatePath(`/groups/${code}/balances`);
  redirect(`/groups/${code}`);
}

export async function deleteExpenseAction(
  joinCode: string,
  expenseId: string,
): Promise<void> {
  const code = joinCode.toUpperCase();
  const { group } = await requireMember(code);
  const existing = await db.expense.findUnique({ where: { id: expenseId } });
  if (!existing || existing.groupId !== group.id) {
    redirect(`/groups/${code}`);
  }
  await db.expense.delete({ where: { id: expenseId } });
  revalidatePath(`/groups/${code}`);
  revalidatePath(`/groups/${code}/balances`);
  redirect(`/groups/${code}`);
}
