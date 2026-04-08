import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireMember } from "@/lib/auth";
import { ExpenseForm } from "@/components/ExpenseForm";

export default async function NewExpensePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code: raw } = await params;
  const code = raw.toUpperCase();
  const { group, currentMemberId } = await requireMember(code);

  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-4 safe-top">
      <Link
        href={`/groups/${code}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to {group.name}
      </Link>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Add expense</h1>
      <ExpenseForm
        joinCode={code}
        members={group.members}
        currentMemberId={currentMemberId}
        baseCurrency={group.baseCurrency}
      />
    </main>
  );
}
