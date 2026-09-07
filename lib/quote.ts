import type { CaseMetrics, Quote, QuoteFreshness } from "./types.ts";

export const STALE_AFTER_DAYS = 3;

export function quoteTotal(quote: Pick<Quote, "priceToman" | "extraCostToman">) {
  const extra = Number.isFinite(quote.extraCostToman ?? 0) ? quote.extraCostToman ?? 0 : 0;
  return Math.max(0, quote.priceToman) + Math.max(0, extra);
}

function localDayNumber(value: Date) {
  return Math.floor(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / 86_400_000
  );
}

export function quoteAgeDays(quotedAt: string, now = new Date()) {
  const quoted = new Date(quotedAt);
  if (Number.isNaN(quoted.getTime())) return Number.POSITIVE_INFINITY;
  return Math.max(0, localDayNumber(now) - localDayNumber(quoted));
}

export function getQuoteFreshness(
  quote: Pick<Quote, "quotedAt" | "validUntil">,
  now = new Date()
): QuoteFreshness {
  if (quote.validUntil) {
    const validUntil = new Date(quote.validUntil);
    if (!Number.isNaN(validUntil.getTime()) && validUntil.getTime() < now.getTime()) {
      return "expired";
    }
  }

  const age = quoteAgeDays(quote.quotedAt, now);
  if (age === 0) return "today";
  if (age <= STALE_AFTER_DAYS) return "recent";
  return "stale";
}

export function freshnessLabel(value: QuoteFreshness) {
  const labels: Record<QuoteFreshness, string> = {
    today: "امروز",
    recent: "جدید",
    stale: "نیاز به استعلام مجدد",
    expired: "منقضی",
  };
  return labels[value];
}

export function latestQuotesByProvider(quotes: Quote[]) {
  const latest = new Map<string, Quote>();

  for (const quote of quotes) {
    const current = latest.get(quote.providerId);
    if (!current) {
      latest.set(quote.providerId, quote);
      continue;
    }

    const currentTime = new Date(current.quotedAt).getTime();
    const nextTime = new Date(quote.quotedAt).getTime();
    const currentCreated = new Date(current.createdAt).getTime();
    const nextCreated = new Date(quote.createdAt).getTime();

    if (
      nextTime > currentTime ||
      (nextTime === currentTime && nextCreated > currentCreated)
    ) {
      latest.set(quote.providerId, quote);
    }
  }

  return Array.from(latest.values()).sort((a, b) => quoteTotal(a) - quoteTotal(b));
}

export function buildCaseMetrics(quotes: Quote[]): CaseMetrics {
  const latestQuotes = latestQuotesByProvider(quotes);
  const totals = latestQuotes.map(quoteTotal);
  const quotedTimes = quotes
    .map((quote) => new Date(quote.quotedAt).getTime())
    .filter(Number.isFinite);

  const minTotal = totals.length ? Math.min(...totals) : null;
  const maxTotal = totals.length ? Math.max(...totals) : null;

  return {
    providerCount: latestQuotes.length,
    quoteCount: quotes.length,
    latestQuotes,
    minTotal,
    maxTotal,
    spread:
      minTotal !== null && maxTotal !== null ? Math.max(0, maxTotal - minTotal) : null,
    latestQuotedAt: quotedTimes.length
      ? new Date(Math.max(...quotedTimes)).toISOString()
      : null,
  };
}

export function quoteChangePercent(current: Quote, previous?: Quote | null) {
  if (!previous) return null;
  const before = quoteTotal(previous);
  const after = quoteTotal(current);
  if (before <= 0) return null;
  return ((after - before) / before) * 100;
}

export function findPreviousQuote(current: Quote, allQuotes: Quote[]) {
  if (current.previousQuoteId) {
    return allQuotes.find((quote) => quote.id === current.previousQuoteId) ?? null;
  }

  const providerQuotes = allQuotes
    .filter(
      (quote) =>
        quote.providerId === current.providerId &&
        quote.id !== current.id &&
        new Date(quote.quotedAt).getTime() <= new Date(current.quotedAt).getTime()
    )
    .sort((a, b) => new Date(b.quotedAt).getTime() - new Date(a.quotedAt).getTime());

  return providerQuotes[0] ?? null;
}
