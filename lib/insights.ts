import { normalizePersianDigits } from "./normalize-persian-digits.ts";
import { latestQuotesByProvider, quoteTotal } from "./quote.ts";
import type { Provider, PurchaseCase, Quote } from "./types.ts";

const DAY_MS = 86_400_000;

export interface PurchaseInsightRow {
  caseId: string;
  title: string;
  purchasedAt: string;
  status: "ordered" | "received";
  actualPaidToman: number;
  selectedQuoteTotalToman: number;
  differenceFromQuoteToman: number;
  differenceFromBudgetToman: number | null;
  savingsVsHighestToman: number;
  quoteCount: number;
  decisionDays: number | null;
  providerKey: string | null;
  providerName: string;
  providerPhone?: string;
  deliveryMeasured: boolean;
  deliveredOnTime: boolean;
}

export interface MonthlySpendPoint {
  key: string;
  label: string;
  totalToman: number;
  purchaseCount: number;
}

export interface SellerInsight {
  key: string;
  name: string;
  phone?: string;
  caseCount: number;
  quoteCount: number;
  purchaseCount: number;
  totalSpentToman: number;
  averageRating: number | null;
  winRate: number;
  lastSeenAt: string;
  deliveryMeasuredCount: number;
  onTimeDeliveryCount: number;
}

export interface PurchaseInsightSummary {
  purchaseCount: number;
  receivedCount: number;
  totalSpentToman: number;
  totalSavingsVsHighestToman: number;
  totalDifferenceFromQuoteToman: number;
  withinBudgetCount: number;
  overBudgetCount: number;
  deliveryMeasuredCount: number;
  onTimeDeliveryCount: number;
  onTimeDeliveryRate: number | null;
  averageQuotesPerPurchase: number;
  averageDecisionDays: number | null;
}

export interface PurchaseInsights {
  summary: PurchaseInsightSummary;
  monthlySpend: MonthlySpendPoint[];
  sellers: SellerInsight[];
  purchases: PurchaseInsightRow[];
  largestSaving: PurchaseInsightRow | null;
  largestOverBudget: PurchaseInsightRow | null;
  mostUsedSeller: SellerInsight | null;
}

function normalizedName(value: string) {
  return normalizePersianDigits(value)
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
    .replace(/\s+/g, " ");
}

function normalizedPhone(value?: string) {
  return normalizePersianDigits(value ?? "").replace(/\D/g, "");
}

export function providerIdentity(provider: Pick<Provider, "name" | "phone">) {
  const phone = normalizedPhone(provider.phone);
  if (phone) return `phone:${phone}`;
  return `name:${normalizedName(provider.name)}`;
}

function storedCalendarDayNumber(value?: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return Math.floor(date.getTime() / DAY_MS);
}

function dateCalendarDayNumber(value?: string | null) {
  if (!value) return null;
  const direct = storedCalendarDayNumber(value);
  if (direct !== null) return direct;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS
  );
}

function calendarDayDiff(from?: string | null, to?: string | null) {
  const start = dateCalendarDayNumber(from);
  const end = dateCalendarDayNumber(to);
  if (start === null || end === null) return null;
  return Math.max(0, end - start);
}

function deliveredOnTime(purchaseCase: PurchaseCase) {
  const outcome = purchaseCase.purchaseOutcome;
  if (
    !outcome ||
    outcome.status !== "received" ||
    !outcome.expectedDeliveryAt ||
    !outcome.receivedAt
  ) {
    return { measured: false, onTime: false };
  }
  const expected = storedCalendarDayNumber(outcome.expectedDeliveryAt);
  const received = storedCalendarDayNumber(outcome.receivedAt);
  if (expected === null || received === null) {
    return { measured: false, onTime: false };
  }
  return { measured: true, onTime: received <= expected };
}

function monthKey(value: string) {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return `${year}-${String(month).padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [yearText, monthText] = key.split("-");
  const date = new Date(Number(yearText), Number(monthText) - 1, 15, 12, 0, 0);
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "short",
  }).format(date);
}

export function buildPurchaseInsights(
  cases: PurchaseCase[],
  quotes: Quote[],
  providers: Provider[]
): PurchaseInsights {
  const quoteById = new Map(quotes.map((quote) => [quote.id, quote]));
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const quotesByCase = new Map<string, Quote[]>();
  for (const quote of quotes) {
    const rows = quotesByCase.get(quote.caseId) ?? [];
    rows.push(quote);
    quotesByCase.set(quote.caseId, rows);
  }

  const purchases: PurchaseInsightRow[] = [];

  for (const purchaseCase of cases) {
    const outcome = purchaseCase.purchaseOutcome;
    if (!outcome) continue;
    const selectedQuote = quoteById.get(outcome.quoteId);
    if (!selectedQuote) continue;

    const caseQuotes = quotesByCase.get(purchaseCase.id) ?? [];
    const latestQuotes = latestQuotesByProvider(caseQuotes);
    const highest = latestQuotes.length
      ? Math.max(...latestQuotes.map((quote) => quoteTotal(quote)))
      : quoteTotal(selectedQuote);
    const provider = providerById.get(selectedQuote.providerId);
    const delivery = deliveredOnTime(purchaseCase);
    const selectedQuoteTotalToman = quoteTotal(selectedQuote);

    purchases.push({
      caseId: purchaseCase.id,
      title: purchaseCase.title,
      purchasedAt: outcome.purchasedAt,
      status: outcome.status,
      actualPaidToman: outcome.actualPaidToman,
      selectedQuoteTotalToman,
      differenceFromQuoteToman: outcome.actualPaidToman - selectedQuoteTotalToman,
      differenceFromBudgetToman: purchaseCase.targetBudgetToman
        ? outcome.actualPaidToman - purchaseCase.targetBudgetToman
        : null,
      savingsVsHighestToman: Math.max(0, highest - outcome.actualPaidToman),
      quoteCount: caseQuotes.length,
      decisionDays: calendarDayDiff(purchaseCase.createdAt, outcome.purchasedAt),
      providerKey: provider ? providerIdentity(provider) : null,
      providerName: provider?.name ?? "فروشنده حذف‌شده",
      providerPhone: provider?.phone,
      deliveryMeasured: delivery.measured,
      deliveredOnTime: delivery.onTime,
    });
  }

  purchases.sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));

  const monthMap = new Map<string, MonthlySpendPoint>();
  for (const purchase of purchases) {
    const key = monthKey(purchase.purchasedAt);
    if (!key) continue;
    const current = monthMap.get(key) ?? {
      key,
      label: monthLabel(key),
      totalToman: 0,
      purchaseCount: 0,
    };
    current.totalToman += purchase.actualPaidToman;
    current.purchaseCount += 1;
    monthMap.set(key, current);
  }
  const monthlySpend = Array.from(monthMap.values())
    .sort((a, b) => a.key.localeCompare(b.key))
    .slice(-12);

  const sellerMap = new Map<
    string,
    {
      key: string;
      name: string;
      phone?: string;
      caseIds: Set<string>;
      quoteCount: number;
      purchaseCount: number;
      totalSpentToman: number;
      ratingTotal: number;
      ratingCount: number;
      lastSeenAt: string;
      deliveryMeasuredCount: number;
      onTimeDeliveryCount: number;
    }
  >();

  for (const provider of providers) {
    const key = providerIdentity(provider);
    const current = sellerMap.get(key) ?? {
      key,
      name: provider.name,
      phone: provider.phone,
      caseIds: new Set<string>(),
      quoteCount: 0,
      purchaseCount: 0,
      totalSpentToman: 0,
      ratingTotal: 0,
      ratingCount: 0,
      lastSeenAt: provider.updatedAt,
      deliveryMeasuredCount: 0,
      onTimeDeliveryCount: 0,
    };
    current.caseIds.add(provider.caseId);
    if (provider.rating !== undefined && Number.isFinite(provider.rating)) {
      current.ratingTotal += provider.rating;
      current.ratingCount += 1;
    }
    if (provider.updatedAt > current.lastSeenAt) {
      current.lastSeenAt = provider.updatedAt;
      current.name = provider.name;
      current.phone = provider.phone ?? current.phone;
    }
    sellerMap.set(key, current);
  }

  for (const quote of quotes) {
    const provider = providerById.get(quote.providerId);
    if (!provider) continue;
    const current = sellerMap.get(providerIdentity(provider));
    if (!current) continue;
    current.quoteCount += 1;
  }

  for (const purchase of purchases) {
    if (!purchase.providerKey) continue;
    const current = sellerMap.get(purchase.providerKey);
    if (!current) continue;
    current.purchaseCount += 1;
    current.totalSpentToman += purchase.actualPaidToman;
    if (purchase.deliveryMeasured) {
      current.deliveryMeasuredCount += 1;
      if (purchase.deliveredOnTime) current.onTimeDeliveryCount += 1;
    }
  }

  const sellers: SellerInsight[] = Array.from(sellerMap.values())
    .map((seller) => ({
      key: seller.key,
      name: seller.name,
      phone: seller.phone,
      caseCount: seller.caseIds.size,
      quoteCount: seller.quoteCount,
      purchaseCount: seller.purchaseCount,
      totalSpentToman: seller.totalSpentToman,
      averageRating:
        seller.ratingCount > 0 ? seller.ratingTotal / seller.ratingCount : null,
      winRate:
        seller.caseIds.size > 0 ? seller.purchaseCount / seller.caseIds.size : 0,
      lastSeenAt: seller.lastSeenAt,
      deliveryMeasuredCount: seller.deliveryMeasuredCount,
      onTimeDeliveryCount: seller.onTimeDeliveryCount,
    }))
    .filter((seller) => seller.quoteCount > 0 || seller.purchaseCount > 0)
    .sort((a, b) => {
      if (b.purchaseCount !== a.purchaseCount) return b.purchaseCount - a.purchaseCount;
      if (b.totalSpentToman !== a.totalSpentToman) return b.totalSpentToman - a.totalSpentToman;
      const aRating = a.averageRating ?? -1;
      const bRating = b.averageRating ?? -1;
      if (bRating !== aRating) return bRating - aRating;
      return b.lastSeenAt.localeCompare(a.lastSeenAt);
    });

  const purchaseCount = purchases.length;
  const receivedCount = purchases.filter((row) => row.status === "received").length;
  const totalSpentToman = purchases.reduce((sum, row) => sum + row.actualPaidToman, 0);
  const totalSavingsVsHighestToman = purchases.reduce(
    (sum, row) => sum + row.savingsVsHighestToman,
    0
  );
  const totalDifferenceFromQuoteToman = purchases.reduce(
    (sum, row) => sum + row.differenceFromQuoteToman,
    0
  );
  const budgetRows = purchases.filter((row) => row.differenceFromBudgetToman !== null);
  const withinBudgetCount = budgetRows.filter(
    (row) => (row.differenceFromBudgetToman ?? 0) <= 0
  ).length;
  const overBudgetCount = budgetRows.filter(
    (row) => (row.differenceFromBudgetToman ?? 0) > 0
  ).length;
  const deliveryMeasuredCount = purchases.filter((row) => row.deliveryMeasured).length;
  const onTimeDeliveryCount = purchases.filter(
    (row) => row.deliveryMeasured && row.deliveredOnTime
  ).length;
  const decisionRows = purchases.filter((row) => row.decisionDays !== null);

  const summary: PurchaseInsightSummary = {
    purchaseCount,
    receivedCount,
    totalSpentToman,
    totalSavingsVsHighestToman,
    totalDifferenceFromQuoteToman,
    withinBudgetCount,
    overBudgetCount,
    deliveryMeasuredCount,
    onTimeDeliveryCount,
    onTimeDeliveryRate:
      deliveryMeasuredCount > 0 ? onTimeDeliveryCount / deliveryMeasuredCount : null,
    averageQuotesPerPurchase:
      purchaseCount > 0
        ? purchases.reduce((sum, row) => sum + row.quoteCount, 0) / purchaseCount
        : 0,
    averageDecisionDays:
      decisionRows.length > 0
        ? decisionRows.reduce((sum, row) => sum + (row.decisionDays ?? 0), 0) /
          decisionRows.length
        : null,
  };

  const largestSaving =
    purchases
      .filter((row) => row.savingsVsHighestToman > 0)
      .sort((a, b) => b.savingsVsHighestToman - a.savingsVsHighestToman)[0] ?? null;

  const largestOverBudget =
    purchases
      .filter((row) => (row.differenceFromBudgetToman ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.differenceFromBudgetToman ?? 0) - (a.differenceFromBudgetToman ?? 0)
      )[0] ?? null;

  const mostUsedSeller = sellers.find((seller) => seller.purchaseCount > 0) ?? null;

  return {
    summary,
    monthlySpend,
    sellers,
    purchases,
    largestSaving,
    largestOverBudget,
    mostUsedSeller,
  };
}
