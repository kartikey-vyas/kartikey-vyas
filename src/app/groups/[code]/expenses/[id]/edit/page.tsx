import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { ExpenseForm } from "@/components/ExpenseForm";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ code: string; id: string }>;
}) {
  const { code: raw, id } = await params;
  const code = raw.toUpperCase();
  const { group, currentMemberId } = await requireMember(code);

  const expense = await db.expense.findUnique({
    where: { id },
    include: { splits: true },
  });
  if (!expense || expense.groupId !== group.id) {
    notFound();
  }

  const initial = {
    id: expense.id,
    description: expense.description,
    amount: expense.amount.toString(),
    currency: expense.currency,
    paidByMemberId: expense.paidByMemberId,
    date: expense.date.toISOString().slice(0, 10),
    splits: expense.splits.map((s) => ({
      memberId: s.memberId,
      shareAmount: s.shareAmount.toString(),
    })),
  };

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-4 safe-top">
      <Link
        href={`/groups/${code}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {group.name}
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Edit expense</h1>
      <ExpenseForm
        joinCode={code}
        members={group.members}
        currentMemberId={currentMemberId}
        baseCurrency={group.baseCurrency}
        initial={initial}
      />
    </main>
  );
}
