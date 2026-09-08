import assert from "node:assert/strict";
import test from "node:test";
import { buildPurchaseInsights, providerIdentity } from "../lib/insights.ts";
import type { Provider, PurchaseCase, Quote } from "../lib/types.ts";

const providers: Provider[] = [
  {
    id: "p1",
    caseId: "c1",
    name: "فروشگاه آلفا",
    phone: "۰۹۱۲۱۲۳۴۵۶۷",
    rating: 5,
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "p2",
    caseId: "c2",
    name: "فروشگاه آلفا",
    phone: "09121234567",
    rating: 4,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "p3",
    caseId: "c1",
    name: "فروشگاه بتا",
    createdAt: "2026-08-01T10:00:00Z",
    updatedAt: "2026-08-01T10:00:00Z",
  },
];

const quotes: Quote[] = [
  {
    id: "q1",
    caseId: "c1",
    providerId: "p1",
    priceToman: 90,
    quotedAt: "2026-08-02T12:00:00Z",
    channel: "phone",
    createdAt: "2026-08-02T12:00:00Z",
    updatedAt: "2026-08-02T12:00:00Z",
  },
  {
    id: "q2",
    caseId: "c1",
    providerId: "p3",
    priceToman: 120,
    quotedAt: "2026-08-02T12:00:00Z",
    channel: "phone",
    createdAt: "2026-08-02T12:00:00Z",
    updatedAt: "2026-08-02T12:00:00Z",
  },
  {
    id: "q3",
    caseId: "c2",
    providerId: "p2",
    priceToman: 210,
    quotedAt: "2026-09-02T12:00:00Z",
    channel: "whatsapp",
    createdAt: "2026-09-02T12:00:00Z",
    updatedAt: "2026-09-02T12:00:00Z",
  },
];

const cases: PurchaseCase[] = [
  {
    id: "c1",
    title: "خرید اول",
    kind: "product",
    status: "decided",
    selectedQuoteId: "q1",
    targetBudgetToman: 100,
    purchaseOutcome: {
      quoteId: "q1",
      status: "received",
      purchasedAt: "2026-08-05T12:00:00Z",
      actualPaidToman: 95,
      expectedDeliveryAt: "2026-08-08T12:00:00Z",
      receivedAt: "2026-08-07T12:00:00Z",
      updatedAt: "2026-08-07T12:00:00Z",
    },
    createdAt: "2026-08-01T08:00:00Z",
    updatedAt: "2026-08-07T12:00:00Z",
  },
  {
    id: "c2",
    title: "خرید دوم",
    kind: "service",
    status: "decided",
    selectedQuoteId: "q3",
    targetBudgetToman: 200,
    purchaseOutcome: {
      quoteId: "q3",
      status: "ordered",
      purchasedAt: "2026-09-03T12:00:00Z",
      actualPaidToman: 220,
      expectedDeliveryAt: "2026-09-10T12:00:00Z",
      updatedAt: "2026-09-03T12:00:00Z",
    },
    createdAt: "2026-09-01T08:00:00Z",
    updatedAt: "2026-09-03T12:00:00Z",
  },
];

test("purchase insights summarize spend savings budget and delivery", () => {
  const insights = buildPurchaseInsights(cases, quotes, providers);
  assert.equal(insights.summary.purchaseCount, 2);
  assert.equal(insights.summary.totalSpentToman, 315);
  assert.equal(insights.summary.totalSavingsVsHighestToman, 25);
  assert.equal(insights.summary.withinBudgetCount, 1);
  assert.equal(insights.summary.overBudgetCount, 1);
  assert.equal(insights.summary.deliveryMeasuredCount, 1);
  assert.equal(insights.summary.onTimeDeliveryCount, 1);
  assert.equal(insights.summary.onTimeDeliveryRate, 1);
});

test("purchase insights compute average quotes and decision time", () => {
  const insights = buildPurchaseInsights(cases, quotes, providers);
  assert.equal(insights.summary.averageQuotesPerPurchase, 1.5);
  assert.equal(insights.summary.averageDecisionDays, 3);
});

test("seller memory merges Persian and Latin versions of the same phone", () => {
  assert.equal(providerIdentity(providers[0]), providerIdentity(providers[1]));
  const insights = buildPurchaseInsights(cases, quotes, providers);
  const alpha = insights.sellers.find((seller) => seller.name === "فروشگاه آلفا");
  assert.ok(alpha);
  assert.equal(alpha.caseCount, 2);
  assert.equal(alpha.quoteCount, 2);
  assert.equal(alpha.purchaseCount, 2);
  assert.equal(alpha.totalSpentToman, 315);
  assert.equal(alpha.averageRating, 4.5);
});

test("monthly spend is chronological and aggregates purchases", () => {
  const insights = buildPurchaseInsights(cases, quotes, providers);
  assert.deepEqual(
    insights.monthlySpend.map((row) => [row.key, row.totalToman, row.purchaseCount]),
    [
      ["2026-08", 95, 1],
      ["2026-09", 220, 1],
    ]
  );
});
