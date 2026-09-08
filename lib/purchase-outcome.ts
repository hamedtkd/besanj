import { quoteTotal } from "./quote.ts";
import type {
  PurchaseCase,
  PurchaseOutcome,
  PurchaseOutcomeStatus,
  Quote,
} from "./types.ts";
import { normalizeOptionalText } from "./validation-rules.ts";

export interface PurchaseOutcomeInput {
  quoteId: string;
  status: PurchaseOutcomeStatus;
  purchasedAt: string;
  actualPaidToman: number;
  orderReference?: string;
  expectedDeliveryAt?: string;
  receivedAt?: string;
  note?: string;
}

function validCalendarValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function normalizePurchaseOutcome(
  input: PurchaseOutcomeInput,
  updatedAt = new Date().toISOString()
): PurchaseOutcome {
  const quoteId = normalizeOptionalText(input.quoteId);
  if (!quoteId) throw new Error("استعلام انتخاب‌شده برای خرید معتبر نیست.");
  if (input.status !== "ordered" && input.status !== "received") {
    throw new Error("وضعیت خرید معتبر نیست.");
  }
  if (!validCalendarValue(input.purchasedAt)) {
    throw new Error("تاریخ خرید معتبر نیست.");
  }
  if (!Number.isFinite(input.actualPaidToman) || input.actualPaidToman <= 0) {
    throw new Error("مبلغ واقعی خرید باید بیشتر از صفر باشد.");
  }

  const expectedDeliveryAt = normalizeOptionalText(input.expectedDeliveryAt);
  const receivedAt = normalizeOptionalText(input.receivedAt);
  if (expectedDeliveryAt && !validCalendarValue(expectedDeliveryAt)) {
    throw new Error("تاریخ تحویل مورد انتظار معتبر نیست.");
  }
  if (receivedAt && !validCalendarValue(receivedAt)) {
    throw new Error("تاریخ دریافت معتبر نیست.");
  }

  return {
    quoteId,
    status: input.status,
    purchasedAt: input.purchasedAt,
    actualPaidToman: Math.round(input.actualPaidToman),
    orderReference: normalizeOptionalText(input.orderReference),
    expectedDeliveryAt,
    receivedAt:
      input.status === "received" ? receivedAt ?? input.purchasedAt : undefined,
    note: normalizeOptionalText(input.note),
    updatedAt,
  };
}

export interface PurchaseOutcomeInsight {
  quotedTotalToman: number;
  actualPaidToman: number;
  differenceFromQuoteToman: number;
  differenceFromBudgetToman: number | null;
  savingsVsHighestToman: number | null;
}

export function buildPurchaseOutcomeInsight(
  purchaseCase: PurchaseCase,
  quote: Quote,
  allLatestQuotes: Quote[] = []
): PurchaseOutcomeInsight | null {
  const outcome = purchaseCase.purchaseOutcome;
  if (!outcome || outcome.quoteId !== quote.id) return null;

  const quotedTotalToman = quoteTotal(quote);
  const actualPaidToman = outcome.actualPaidToman;
  const highest = allLatestQuotes.length
    ? Math.max(...allLatestQuotes.map((item) => quoteTotal(item)))
    : null;

  return {
    quotedTotalToman,
    actualPaidToman,
    differenceFromQuoteToman: actualPaidToman - quotedTotalToman,
    differenceFromBudgetToman: purchaseCase.targetBudgetToman
      ? actualPaidToman - purchaseCase.targetBudgetToman
      : null,
    savingsVsHighestToman:
      highest === null ? null : Math.max(0, highest - actualPaidToman),
  };
}

export function purchaseOutcomeStatusLabel(status: PurchaseOutcomeStatus) {
  return status === "received" ? "دریافت شده" : "سفارش ثبت شده";
}
