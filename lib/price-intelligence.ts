import { caseMatchesTag } from "./categories.ts";
import { getQuoteFreshness, latestQuotesByProvider, quoteTotal } from "./quote.ts";
import type {
  Provider,
  PurchaseCase,
  Quote,
  QuoteFreshness,
  SellerProfile,
} from "./types.ts";

export type CasePriceSignal =
  | "insufficient"
  | "stale"
  | "excellent"
  | "good"
  | "fair"
  | "high";

export type PriceTrend = "insufficient" | "down" | "flat" | "up";
export type PriceConfidence = "low" | "medium" | "high";
export type SellerPricePosition = "insufficient" | "competitive" | "average" | "high";

export interface DailyBestPrice {
  dayKey: string;
  quotedAt: string;
  quoteId: string;
  providerId: string;
  totalToman: number;
}

export interface CasePriceIntelligence {
  caseId: string;
  quoteCount: number;
  providerCount: number;
  snapshotCount: number;
  currentBestQuoteId: string | null;
  currentBestToman: number | null;
  currentBestFreshness: QuoteFreshness | null;
  historicalLowToman: number | null;
  historicalMedianToman: number | null;
  historicalHighToman: number | null;
  currentVsMedianPercent: number | null;
  currentVsLowPercent: number | null;
  trend: PriceTrend;
  trendPercent: number | null;
  signal: CasePriceSignal;
  confidence: PriceConfidence;
  isAtHistoricalLow: boolean;
}

export interface SellerPriceIntelligence {
  sellerProfileId: string;
  name: string;
  comparisonCaseCount: number;
  cheapestCaseCount: number;
  cheapestRate: number | null;
  medianPremiumPercent: number | null;
  averagePremiumPercent: number | null;
  position: SellerPricePosition;
  confidence: PriceConfidence;
  lastComparedAt: string | null;
}

export interface PersonalPriceCaseRow extends CasePriceIntelligence {
  title: string;
  status: PurchaseCase["status"];
}

export interface PersonalPriceIntelligence {
  cases: PersonalPriceCaseRow[];
  sellers: SellerPriceIntelligence[];
  eligibleCaseCount: number;
  favorableCaseCount: number;
  highCaseCount: number;
  averageCurrentVsMedianPercent: number | null;
  bestOpportunity: PersonalPriceCaseRow | null;
  topCompetitiveSeller: SellerPriceIntelligence | null;
}

function finitePositive(value: number) {
  return Number.isFinite(value) && value > 0;
}

function calendarDayKey(value: string) {
  const direct = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (direct) return `${direct[1]}-${direct[2]}-${direct[3]}`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function median(values: number[]) {
  const rows = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!rows.length) return null;
  const middle = Math.floor(rows.length / 2);
  return rows.length % 2 === 0
    ? (rows[middle - 1] + rows[middle]) / 2
    : rows[middle];
}

function percentDelta(current: number | null, baseline: number | null) {
  if (current === null || baseline === null || baseline <= 0) return null;
  return ((current - baseline) / baseline) * 100;
}

export function dailyBestPrices(quotes: Quote[]): DailyBestPrice[] {
  const byDay = new Map<string, DailyBestPrice>();

  for (const quote of quotes) {
    const dayKey = calendarDayKey(quote.quotedAt);
    const totalToman = quoteTotal(quote);
    if (!dayKey || !finitePositive(totalToman)) continue;

    const current = byDay.get(dayKey);
    if (!current || totalToman < current.totalToman) {
      byDay.set(dayKey, {
        dayKey,
        quotedAt: quote.quotedAt,
        quoteId: quote.id,
        providerId: quote.providerId,
        totalToman,
      });
    }
  }

  return Array.from(byDay.values()).sort((left, right) =>
    left.dayKey.localeCompare(right.dayKey)
  );
}

function trendFromSnapshots(snapshots: DailyBestPrice[]) {
  if (snapshots.length < 4) {
    return { trend: "insufficient" as const, trendPercent: null };
  }

  const split = Math.max(1, snapshots.length - 3);
  const previousWindow = snapshots.slice(Math.max(0, split - 3), split);
  const recentWindow = snapshots.slice(split);
  const before = median(previousWindow.map((row) => row.totalToman));
  const after = median(recentWindow.map((row) => row.totalToman));
  const trendPercent = percentDelta(after, before);

  if (trendPercent === null) {
    return { trend: "insufficient" as const, trendPercent: null };
  }
  if (trendPercent <= -2) return { trend: "down" as const, trendPercent };
  if (trendPercent >= 2) return { trend: "up" as const, trendPercent };
  return { trend: "flat" as const, trendPercent };
}

function caseConfidence(snapshotCount: number, providerCount: number): PriceConfidence {
  if (snapshotCount >= 6 && providerCount >= 3) return "high";
  if (snapshotCount >= 3 && providerCount >= 2) return "medium";
  return "low";
}

function buildSignal(input: {
  snapshotCount: number;
  currentFreshness: QuoteFreshness | null;
  currentVsMedianPercent: number | null;
  isAtHistoricalLow: boolean;
}): CasePriceSignal {
  if (input.snapshotCount < 3 || input.currentVsMedianPercent === null) {
    return "insufficient";
  }
  if (input.currentFreshness === "stale" || input.currentFreshness === "expired") {
    return "stale";
  }
  if (input.isAtHistoricalLow || input.currentVsMedianPercent <= -8) {
    return "excellent";
  }
  if (input.currentVsMedianPercent <= -2) return "good";
  if (input.currentVsMedianPercent <= 5) return "fair";
  return "high";
}

export function buildCasePriceIntelligence(
  caseId: string,
  quotes: Quote[],
  options: { now?: Date } = {}
): CasePriceIntelligence {
  const caseQuotes = quotes.filter((quote) => quote.caseId === caseId);
  const snapshots = dailyBestPrices(caseQuotes);
  const latestQuotes = latestQuotesByProvider(caseQuotes);
  const currentBestQuote = latestQuotes.find((quote) => finitePositive(quoteTotal(quote))) ?? null;
  const currentBestToman = currentBestQuote ? quoteTotal(currentBestQuote) : null;
  const snapshotTotals = snapshots.map((row) => row.totalToman);
  const historicalLowToman = snapshotTotals.length ? Math.min(...snapshotTotals) : null;
  const historicalHighToman = snapshotTotals.length ? Math.max(...snapshotTotals) : null;
  const historicalMedianToman = median(snapshotTotals);
  const providerCount = new Set(caseQuotes.map((quote) => quote.providerId)).size;
  const currentBestFreshness = currentBestQuote
    ? getQuoteFreshness(currentBestQuote, options.now ?? new Date())
    : null;
  const currentVsMedianPercent = percentDelta(currentBestToman, historicalMedianToman);
  const currentVsLowPercent = percentDelta(currentBestToman, historicalLowToman);
  const isAtHistoricalLow =
    currentBestToman !== null &&
    historicalLowToman !== null &&
    currentBestToman <= historicalLowToman * 1.001;
  const trend = trendFromSnapshots(snapshots);

  return {
    caseId,
    quoteCount: caseQuotes.length,
    providerCount,
    snapshotCount: snapshots.length,
    currentBestQuoteId: currentBestQuote?.id ?? null,
    currentBestToman,
    currentBestFreshness,
    historicalLowToman,
    historicalMedianToman,
    historicalHighToman,
    currentVsMedianPercent,
    currentVsLowPercent,
    trend: trend.trend,
    trendPercent: trend.trendPercent,
    signal: buildSignal({
      snapshotCount: snapshots.length,
      currentFreshness: currentBestFreshness,
      currentVsMedianPercent,
      isAtHistoricalLow,
    }),
    confidence: caseConfidence(snapshots.length, providerCount),
    isAtHistoricalLow,
  };
}

function sellerPositionFromMedian(
  comparisonCaseCount: number,
  medianPremiumPercent: number | null
): SellerPricePosition {
  if (comparisonCaseCount < 2 || medianPremiumPercent === null) return "insufficient";
  if (medianPremiumPercent <= 2.5) return "competitive";
  if (medianPremiumPercent <= 8) return "average";
  return "high";
}

function sellerConfidence(comparisonCaseCount: number): PriceConfidence {
  if (comparisonCaseCount >= 5) return "high";
  if (comparisonCaseCount >= 2) return "medium";
  return "low";
}

export function buildSellerPriceIntelligence(
  profile: Pick<SellerProfile, "id" | "name">,
  providers: Provider[],
  quotes: Quote[]
): SellerPriceIntelligence {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const cases = new Set(
    providers
      .filter((provider) => provider.sellerProfileId === profile.id)
      .map((provider) => provider.caseId)
  );
  const premiums: number[] = [];
  let cheapestCaseCount = 0;
  let lastComparedAt: string | null = null;

  for (const caseId of cases) {
    const caseQuotes = quotes.filter((quote) => quote.caseId === caseId);
    const latest = latestQuotesByProvider(caseQuotes);
    if (latest.length < 2) continue;

    const sellerRows = latest.filter(
      (quote) => providerById.get(quote.providerId)?.sellerProfileId === profile.id
    );
    if (!sellerRows.length) continue;

    const sellerTotal = Math.min(...sellerRows.map(quoteTotal));
    const bestTotal = Math.min(...latest.map(quoteTotal));
    if (!finitePositive(sellerTotal) || !finitePositive(bestTotal)) continue;

    const premiumPercent = ((sellerTotal - bestTotal) / bestTotal) * 100;
    premiums.push(Math.max(0, premiumPercent));
    if (sellerTotal <= bestTotal * 1.005) cheapestCaseCount += 1;

    const comparedAt = sellerRows
      .map((quote) => quote.quotedAt)
      .filter(Boolean)
      .sort()
      .at(-1);
    if (comparedAt && (!lastComparedAt || comparedAt > lastComparedAt)) {
      lastComparedAt = comparedAt;
    }
  }

  const medianPremiumPercent = median(premiums);
  const normalizedMedian = medianPremiumPercent === null ? null : Math.max(0, medianPremiumPercent);
  const averagePremiumPercent = premiums.length
    ? premiums.reduce((sum, value) => sum + value, 0) / premiums.length
    : null;

  return {
    sellerProfileId: profile.id,
    name: profile.name,
    comparisonCaseCount: premiums.length,
    cheapestCaseCount,
    cheapestRate: premiums.length ? cheapestCaseCount / premiums.length : null,
    medianPremiumPercent: normalizedMedian,
    averagePremiumPercent,
    position: sellerPositionFromMedian(premiums.length, normalizedMedian),
    confidence: sellerConfidence(premiums.length),
    lastComparedAt,
  };
}

function caseIncluded(
  purchaseCase: PurchaseCase,
  filters: { categoryKey?: string; tag?: string }
) {
  if (filters.categoryKey && filters.categoryKey !== "all") {
    if (filters.categoryKey === "uncategorized") {
      if (purchaseCase.categoryKey) return false;
    } else if (purchaseCase.categoryKey !== filters.categoryKey) {
      return false;
    }
  }
  if (filters.tag && filters.tag !== "all" && !caseMatchesTag(purchaseCase, filters.tag)) {
    return false;
  }
  return true;
}

function opportunityRank(row: PersonalPriceCaseRow) {
  const confidenceWeight = row.confidence === "high" ? 0 : row.confidence === "medium" ? 1 : 2;
  const signalWeight = row.signal === "excellent" ? 0 : row.signal === "good" ? 1 : 2;
  return [signalWeight, confidenceWeight, row.currentVsMedianPercent ?? Number.POSITIVE_INFINITY];
}

export function buildPersonalPriceIntelligence(
  cases: PurchaseCase[],
  quotes: Quote[],
  providers: Provider[],
  sellerProfiles: SellerProfile[],
  filters: { categoryKey?: string; tag?: string } = {},
  options: { now?: Date } = {}
): PersonalPriceIntelligence {
  const includedCases = cases.filter((purchaseCase) => caseIncluded(purchaseCase, filters));
  const includedCaseIds = new Set(includedCases.map((purchaseCase) => purchaseCase.id));
  const includedQuotes = quotes.filter((quote) => includedCaseIds.has(quote.caseId));
  const includedProviders = providers.filter((provider) => includedCaseIds.has(provider.caseId));

  const caseRows = includedCases
    .map((purchaseCase) => ({
      ...buildCasePriceIntelligence(purchaseCase.id, includedQuotes, options),
      title: purchaseCase.title,
      status: purchaseCase.status,
    }))
    .filter((row) => row.quoteCount > 0)
    .sort((left, right) => {
      const leftDelta = left.currentVsMedianPercent ?? Number.POSITIVE_INFINITY;
      const rightDelta = right.currentVsMedianPercent ?? Number.POSITIVE_INFINITY;
      return leftDelta - rightDelta;
    });

  const eligibleCases = caseRows.filter((row) =>
    ["excellent", "good", "fair", "high"].includes(row.signal)
  );
  const favorableCaseCount = eligibleCases.filter((row) =>
    row.signal === "excellent" || row.signal === "good"
  ).length;
  const highCaseCount = eligibleCases.filter((row) => row.signal === "high").length;
  const deltas = eligibleCases
    .map((row) => row.currentVsMedianPercent)
    .filter((value): value is number => value !== null && Number.isFinite(value));

  const opportunityRows = caseRows
    .filter(
      (row) =>
        row.status === "active" &&
        (row.signal === "excellent" || row.signal === "good") &&
        row.currentVsMedianPercent !== null
    )
    .sort((left, right) => {
      const leftRank = opportunityRank(left);
      const rightRank = opportunityRank(right);
      for (let index = 0; index < leftRank.length; index += 1) {
        if (leftRank[index] !== rightRank[index]) return leftRank[index] - rightRank[index];
      }
      return left.title.localeCompare(right.title, "fa");
    });

  const sellers = sellerProfiles
    .map((profile) => buildSellerPriceIntelligence(profile, includedProviders, includedQuotes))
    .filter((row) => row.comparisonCaseCount > 0)
    .sort((left, right) => {
      const leftMedian = left.medianPremiumPercent ?? Number.POSITIVE_INFINITY;
      const rightMedian = right.medianPremiumPercent ?? Number.POSITIVE_INFINITY;
      if (leftMedian !== rightMedian) return leftMedian - rightMedian;
      if (right.comparisonCaseCount !== left.comparisonCaseCount) {
        return right.comparisonCaseCount - left.comparisonCaseCount;
      }
      return left.name.localeCompare(right.name, "fa");
    });

  const topCompetitiveSeller =
    sellers.find((row) => row.position === "competitive" && row.comparisonCaseCount >= 2) ?? null;

  return {
    cases: caseRows,
    sellers,
    eligibleCaseCount: eligibleCases.length,
    favorableCaseCount,
    highCaseCount,
    averageCurrentVsMedianPercent: deltas.length
      ? deltas.reduce((sum, value) => sum + value, 0) / deltas.length
      : null,
    bestOpportunity: opportunityRows[0] ?? null,
    topCompetitiveSeller,
  };
}

export function casePriceSignalLabel(signal: CasePriceSignal) {
  const labels: Record<CasePriceSignal, string> = {
    insufficient: "داده کم",
    stale: "نیاز به استعلام تازه",
    excellent: "در کف سابقه",
    good: "مناسب",
    fair: "معمولی",
    high: "بالاتر از سابقه",
  };
  return labels[signal];
}

export function priceTrendLabel(trend: PriceTrend) {
  const labels: Record<PriceTrend, string> = {
    insufficient: "روند نامشخص",
    down: "روند کاهشی",
    flat: "روند تقریباً ثابت",
    up: "روند افزایشی",
  };
  return labels[trend];
}

export function priceConfidenceLabel(confidence: PriceConfidence) {
  const labels: Record<PriceConfidence, string> = {
    low: "اطمینان کم",
    medium: "اطمینان متوسط",
    high: "اطمینان زیاد",
  };
  return labels[confidence];
}

export function sellerPricePositionLabel(position: SellerPricePosition) {
  const labels: Record<SellerPricePosition, string> = {
    insufficient: "داده کم",
    competitive: "اغلب رقابتی",
    average: "معمولاً نزدیک بازار شخصی",
    high: "اغلب گران‌تر",
  };
  return labels[position];
}
