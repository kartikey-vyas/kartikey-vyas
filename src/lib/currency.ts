import { db } from "./db";
import { Decimal } from "./money";

// 12-hour TTL for cached FX rates. Frankfurter publishes ECB reference
// rates once per day so fresher caching is pointless.
const TTL_MS = 12 * 60 * 60 * 1000;

type FrankfurterResponse = {
  amount: number;
  base: string;
  date: string;
  rates: Record<string, number>;
};

async function fetchLatest(base: string): Promise<FrankfurterResponse> {
  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(base)}`;
  const res = await fetch(url, {
    next: { revalidate: 43200 },
  });
  if (!res.ok) {
    throw new Error(`Frankfurter request failed: ${res.status}`);
  }
  return (await res.json()) as FrankfurterResponse;
}

async function refreshRates(base: string): Promise<void> {
  const data = await fetchLatest(base);
  const now = new Date();
  const ops = Object.entries(data.rates).map(([quote, rate]) =>
    db.fxRate.upsert({
      where: { base_quote: { base, quote } },
      create: { base, quote, rate: new Decimal(rate).toFixed(8), fetchedAt: now },
      update: { rate: new Decimal(rate).toFixed(8), fetchedAt: now },
    }),
  );
  await db.$transaction(ops);
}

/**
 * Returns the exchange rate from `base` → `quote` as a Decimal.
 * Reads from the DB cache first; refreshes from Frankfurter if missing or
 * stale. Throws if the API fails and no cached row exists.
 */
export async function getRate(base: string, quote: string): Promise<Decimal> {
  if (base === quote) return new Decimal(1);

  const existing = await db.fxRate.findUnique({
    where: { base_quote: { base, quote } },
  });

  const isStale =
    !existing || Date.now() - existing.fetchedAt.getTime() > TTL_MS;

  if (isStale) {
    try {
      await refreshRates(base);
    } catch (err) {
      if (!existing) {
        throw new Error(
          `Exchange rate ${base}→${quote} unavailable: ${
            err instanceof Error ? err.message : String(err)
          }`,
        );
      }
      // Keep using the stale cached row if the API call fails.
    }
  }

  const row = await db.fxRate.findUnique({
    where: { base_quote: { base, quote } },
  });
  if (!row) {
    throw new Error(`Exchange rate ${base}→${quote} not available`);
  }
  return new Decimal(row.rate.toString());
}

/** Converts a value from one currency to another using getRate. */
export async function convert(
  value: Decimal.Value,
  from: string,
  to: string,
): Promise<Decimal> {
  const rate = await getRate(from, to);
  return new Decimal(value).mul(rate);
}
