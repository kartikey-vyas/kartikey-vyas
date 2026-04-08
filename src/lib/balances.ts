import { db } from "./db";
import { convert } from "./currency";
import { Decimal } from "./money";

export type MemberBalance = {
  memberId: string;
  displayName: string;
  net: Decimal; // positive = is owed; negative = owes
};

export type Transfer = {
  from: string; // memberId
  fromName: string;
  to: string; // memberId
  toName: string;
  amount: Decimal; // in group base currency
};

export type BalancesResult = {
  baseCurrency: string;
  balances: MemberBalance[];
  transfers: Transfer[];
  error?: string;
};

/**
 * Computes per-member net balances (in the group's base currency) and a
 * simplified list of transfers that settles all debts.
 *
 * Returns an `error` string if FX conversion fails; in that case balances
 * and transfers will be empty. Callers should still render the expense
 * list even when this returns an error.
 */
export async function computeBalances(groupId: string): Promise<BalancesResult> {
  const group = await db.group.findUnique({
    where: { id: groupId },
    include: {
      members: { orderBy: { createdAt: "asc" } },
      expenses: { include: { splits: true } },
    },
  });
  if (!group) {
    return {
      baseCurrency: "USD",
      balances: [],
      transfers: [],
      error: "Group not found",
    };
  }

  const baseCurrency = group.baseCurrency;
  const nets = new Map<string, Decimal>();
  for (const m of group.members) {
    nets.set(m.id, new Decimal(0));
  }

  try {
    for (const expense of group.expenses) {
      const amountBase = await convert(
        expense.amount.toString(),
        expense.currency,
        baseCurrency,
      );
      // Payer is credited the full expense amount.
      nets.set(
        expense.paidByMemberId,
        (nets.get(expense.paidByMemberId) ?? new Decimal(0)).plus(amountBase),
      );
      // Each participant is debited their share.
      for (const split of expense.splits) {
        const shareBase = await convert(
          split.shareAmount.toString(),
          expense.currency,
          baseCurrency,
        );
        nets.set(
          split.memberId,
          (nets.get(split.memberId) ?? new Decimal(0)).minus(shareBase),
        );
      }
    }
  } catch (err) {
    return {
      baseCurrency,
      balances: [],
      transfers: [],
      error:
        err instanceof Error
          ? err.message
          : "Unable to compute balances (exchange rate lookup failed)",
    };
  }

  const balances: MemberBalance[] = group.members.map((m) => ({
    memberId: m.id,
    displayName: m.displayName,
    net: (nets.get(m.id) ?? new Decimal(0)).toDecimalPlaces(2),
  }));

  const transfers = simplifyDebts(balances);

  return { baseCurrency, balances, transfers };
}

/**
 * Greedy debt-simplification. Matches the largest creditor with the largest
 * debtor, emits a transfer of min(|credit|, |debt|), decrements both, repeats.
 * O(n log n) — n is small for trip-sized groups.
 */
export function simplifyDebts(balances: MemberBalance[]): Transfer[] {
  const creditors = balances
    .filter((b) => b.net.gt(0))
    .map((b) => ({ ...b, remaining: new Decimal(b.net) }))
    .sort((a, b) => b.remaining.cmp(a.remaining));
  const debtors = balances
    .filter((b) => b.net.lt(0))
    .map((b) => ({ ...b, remaining: new Decimal(b.net).abs() }))
    .sort((a, b) => b.remaining.cmp(a.remaining));

  const transfers: Transfer[] = [];
  let ci = 0;
  let di = 0;
  while (ci < creditors.length && di < debtors.length) {
    const c = creditors[ci];
    const d = debtors[di];
    const amount = Decimal.min(c.remaining, d.remaining).toDecimalPlaces(2);
    if (amount.gt(0)) {
      transfers.push({
        from: d.memberId,
        fromName: d.displayName,
        to: c.memberId,
        toName: c.displayName,
        amount,
      });
    }
    c.remaining = c.remaining.minus(amount);
    d.remaining = d.remaining.minus(amount);
    if (c.remaining.lte(0.005)) ci++;
    if (d.remaining.lte(0.005)) di++;
  }
  return transfers;
}
