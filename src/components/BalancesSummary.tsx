import { ArrowRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { formatMoney } from "@/lib/money";
import type { BalancesResult } from "@/lib/balances";

export function BalancesSummary({
  result,
  currentMemberId,
}: {
  result: BalancesResult;
  currentMemberId: string;
}) {
  const { balances, transfers, baseCurrency, error } = result;

  if (error) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <p className="font-medium">Couldn&apos;t compute balances</p>
          <p className="mt-1 text-xs opacity-90">{error}</p>
        </div>
      </div>
    );
  }

  const hasActivity = balances.some((b) => !b.net.equals(0));
  if (!hasActivity) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium">All settled up</p>
          <p className="text-sm text-muted-foreground">
            Nothing owed, nothing due.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Net balances
        </h2>
        <ul className="divide-y rounded-2xl border bg-card">
          {balances.map((b) => {
            const isYou = b.memberId === currentMemberId;
            const positive = b.net.gt(0);
            const zero = b.net.equals(0);
            return (
              <li
                key={b.memberId}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="font-medium">
                  {b.displayName}
                  {isYou && (
                    <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                  )}
                </span>
                <span
                  className={
                    zero
                      ? "text-sm text-muted-foreground"
                      : positive
                      ? "text-sm font-semibold text-emerald-600"
                      : "text-sm font-semibold text-rose-600"
                  }
                >
                  {zero
                    ? "settled"
                    : positive
                    ? `+${formatMoney(b.net, baseCurrency)}`
                    : `−${formatMoney(b.net.abs(), baseCurrency)}`}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Suggested settlements
        </h2>
        {transfers.length === 0 ? (
          <p className="rounded-2xl border bg-card px-4 py-6 text-center text-sm text-muted-foreground">
            Nothing to settle.
          </p>
        ) : (
          <ul className="divide-y rounded-2xl border bg-card">
            {transfers.map((t, i) => (
              <li
                key={i}
                className="flex items-center gap-3 px-4 py-3"
              >
                <span className="flex-1 truncate font-medium">
                  {t.fromName}
                  {t.from === currentMemberId && (
                    <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                  )}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="flex-1 truncate text-right font-medium">
                  {t.toName}
                  {t.to === currentMemberId && (
                    <span className="ml-1 text-xs text-muted-foreground">(you)</span>
                  )}
                </span>
                <span className="w-24 shrink-0 text-right font-semibold">
                  {formatMoney(t.amount, baseCurrency)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Converted to {baseCurrency} at today&apos;s exchange rate.
        </p>
      </section>
    </div>
  );
}
