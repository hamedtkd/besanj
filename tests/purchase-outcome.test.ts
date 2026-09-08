import test from "node:test";
import assert from "node:assert/strict";
import {
  buildPurchaseOutcomeInsight,
  normalizePurchaseOutcome,
  purchaseOutcomeStatusLabel,
} from "../lib/purchase-outcome.ts";
import type { PurchaseCase, Quote } from "../lib/types.ts";

const quote: Quote = {
  id: "q1",
  caseId: "case-1",
  providerId: "p1",
  priceToman: 72_000_000,
  extraCostToman: 1_000_000,
  quotedAt: "2026-09-08T12:00:00.000Z",
  channel: "phone",
  createdAt: "2026-09-08T12:00:00.000Z",
  updatedAt: "2026-09-08T12:00:00.000Z",
};

function caseWithOutcome(actualPaidToman: number): PurchaseCase {
  return {
    id: "case-1",
    title: "لپ‌تاپ",
    kind: "product",
    status: "decided",
    selectedQuoteId: "q1",
    targetBudgetToman: 75_000_000,
    purchaseOutcome: {
      quoteId: "q1",
      status: "ordered",
      purchasedAt: "2026-09-08T23:59:59.999Z",
      actualPaidToman,
      updatedAt: "2026-09-08T14:00:00.000Z",
    },
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-08T14:00:00.000Z",
  };
}

test("purchase outcome normalizes optional text and money", () => {
  const outcome = normalizePurchaseOutcome(
    {
      quoteId: " q1 ",
      status: "ordered",
      purchasedAt: "2026-09-08T23:59:59.999Z",
      actualPaidToman: 73_500_000.4,
      orderReference: "  INV-42  ",
      note: "  تحویل عصر  ",
    },
    "2026-09-08T14:00:00.000Z"
  );
  assert.equal(outcome.quoteId, "q1");
  assert.equal(outcome.actualPaidToman, 73_500_000);
  assert.equal(outcome.orderReference, "INV-42");
  assert.equal(outcome.note, "تحویل عصر");
});

test("received purchase defaults received date to purchase date", () => {
  const outcome = normalizePurchaseOutcome({
    quoteId: "q1",
    status: "received",
    purchasedAt: "2026-09-08T23:59:59.999Z",
    actualPaidToman: 73_000_000,
  });
  assert.equal(outcome.receivedAt, outcome.purchasedAt);
  assert.equal(purchaseOutcomeStatusLabel(outcome.status), "دریافت شده");
});

test("purchase outcome rejects zero actual payment", () => {
  assert.throws(
    () =>
      normalizePurchaseOutcome({
        quoteId: "q1",
        status: "ordered",
        purchasedAt: "2026-09-08T23:59:59.999Z",
        actualPaidToman: 0,
      }),
    /بیشتر از صفر/
  );
});

test("purchase insight compares actual payment with quote budget and market spread", () => {
  const other: Quote = { ...quote, id: "q2", providerId: "p2", priceToman: 82_000_000, extraCostToman: 0 };
  const insight = buildPurchaseOutcomeInsight(
    caseWithOutcome(71_000_000),
    quote,
    [quote, other]
  );
  assert.ok(insight);
  assert.equal(insight.quotedTotalToman, 73_000_000);
  assert.equal(insight.differenceFromQuoteToman, -2_000_000);
  assert.equal(insight.differenceFromBudgetToman, -4_000_000);
  assert.equal(insight.savingsVsHighestToman, 11_000_000);
});
