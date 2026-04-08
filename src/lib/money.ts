import Decimal from "decimal.js";

// Configure Decimal for currency math: 20 significant digits, banker's rounding.
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_EVEN });

export { Decimal };

export type DecimalLike = Decimal.Value;

/**
 * Splits a total amount equally among n participants, distributing any
 * cent-remainder to the first participants deterministically so the sum of
 * shares equals the total exactly.
 *
 * Example: splitEqually(10, 3) → [3.34, 3.33, 3.33]
 */
export function splitEqually(total: DecimalLike, n: number): Decimal[] {
  if (n <= 0) return [];
  const totalDec = new Decimal(total);
  const cents = totalDec.mul(100).round();
  const base = cents.div(n).floor();
  const remainder = cents.minus(base.mul(n)).toNumber();
  const shares: Decimal[] = [];
  for (let i = 0; i < n; i++) {
    const extra = i < remainder ? 1 : 0;
    shares.push(base.plus(extra).div(100));
  }
  return shares;
}

/**
 * Formats a Decimal as a currency string like "$1,234.56 AUD".
 * Uses Intl.NumberFormat for locale grouping.
 */
export function formatMoney(value: DecimalLike, currency: string): string {
  const n = new Decimal(value).toNumber();
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(n);
  } catch {
    // Fallback if currency code isn't recognised by Intl.
    return `${n.toFixed(2)} ${currency}`;
  }
}

export function toDecimalString(value: DecimalLike): string {
  return new Decimal(value).toFixed(2);
}
