import { requireMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { convert } from "@/lib/currency";
import { Decimal } from "@/lib/money";
import { GroupHeader } from "@/components/GroupHeader";
import { GroupTabs } from "@/components/GroupTabs";
import { ExpenseList, type ExpenseRow } from "@/components/ExpenseList";
import { FloatingAddButton } from "@/components/FloatingAddButton";

export default async function GroupDashboard({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const { group, currentMemberId } = await requireMember(code);

  const expenses = await db.expense.findMany({
    where: { groupId: group.id },
    include: {
      paidBy: { select: { id: true, displayName: true } },
      splits: {
        select: { memberId: true, shareAmount: true },
      },
    },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });

  // Attempt to compute each expense's "your share" in the group's base
  // currency. If FX lookup fails we just omit the converted amount for
  // that row — the list itself still renders.
  const rows: ExpenseRow[] = await Promise.all(
    expenses.map(async (e): Promise<ExpenseRow> => {
      const mySplit = e.splits.find((s) => s.memberId === currentMemberId);
      const youPaid = e.paidByMemberId === currentMemberId;
      let youShareBase: Decimal | null = null;
      if (mySplit) {
        try {
          youShareBase = (
            await convert(mySplit.shareAmount.toString(), e.currency, group.baseCurrency)
          ).toDecimalPlaces(2);
        } catch {
          youShareBase = null;
        }
      }
      return {
        id: e.id,
        description: e.description,
        amount: e.amount.toString(),
        currency: e.currency,
        date: e.date,
        paidByName: e.paidBy.displayName,
        participantCount: e.splits.length,
        youShareBase,
        baseCurrency: group.baseCurrency,
        youPaid,
      };
    }),
  );

  const currentMember = group.members.find((m) => m.id === currentMemberId);

  return (
    <div className="min-h-dvh pb-28">
      <GroupHeader
        groupName={group.name}
        joinCode={code}
        subtitle={`${group.members.length} ${
          group.members.length === 1 ? "member" : "members"
        } · You&apos;re ${currentMember?.displayName ?? "a member"}`}
      />
      <main className="mx-auto max-w-md px-4 py-5">
        <div className="mb-4">
          <GroupTabs joinCode={code} />
        </div>
        <ExpenseList expenses={rows} joinCode={code} />
      </main>
      <FloatingAddButton href={`/groups/${code}/expenses/new`} />
    </div>
  );
}
