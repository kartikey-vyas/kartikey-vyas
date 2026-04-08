import Link from "next/link";
import { Decimal, formatMoney } from "@/lib/money";
import { ChevronRight, Receipt } from "lucide-react";

type ExpenseRow = {
  id: string;
  description: string;
  amount: Decimal.Value;
  currency: string;
  date: Date;
  paidByName: string;
  participantCount: number;
  youShareBase: Decimal | null;
  baseCurrency: string;
  youPaid: boolean;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ExpenseList({
  expenses,
  joinCode,
}: {
  expenses: ExpenseRow[];
  joinCode: string;
}) {
  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">No expenses yet</p>
          <p className="text-sm text-muted-foreground">
            Tap &ldquo;Add expense&rdquo; to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {expenses.map((e) => (
        <li key={e.id}>
          <Link
            href={`/groups/${joinCode}/expenses/${e.id}/edit`}
            className="flex items-center gap-3 px-4 py-3.5 transition active:bg-secondary/60"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
              <Receipt className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{e.description}</p>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {e.paidByName} paid · {formatDate(e.date)} · {e.participantCount}{" "}
                {e.participantCount === 1 ? "person" : "people"}
              </p>
            </div>
            <div className="flex flex-col items-end text-right">
              <span className="font-semibold">
                {formatMoney(e.amount, e.currency)}
              </span>
              {e.youShareBase !== null && (
                <span
                  className={
                    "mt-0.5 text-xs " +
                    (e.youPaid
                      ? "text-emerald-600"
                      : "text-muted-foreground")
                  }
                >
                  {e.youPaid ? "you lent" : "you owe"}{" "}
                  {formatMoney(e.youShareBase, e.baseCurrency)}
                </span>
              )}
            </div>
            <ChevronRight className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export type { ExpenseRow };
