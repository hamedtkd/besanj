import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCaseMetrics,
  getQuoteFreshness,
  latestQuotesByProvider,
  quoteChangePercent,
  quoteTotal,
} from "../lib/quote.ts";
import type { Quote } from "../lib/types.ts";

function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    caseId: "case-1",
    providerId: overrides.providerId ?? "provider-1",
    priceToman: overrides.priceToman ?? 100_000,
    extraCostToman: overrides.extraCostToman,
    quotedAt: overrides.quotedAt ?? "2026-09-06T10:00:00.000Z",
    validUntil: overrides.validUntil,
    deliveryDays: overrides.deliveryDays,
    warranty: overrides.warranty,
    paymentTerms: overrides.paymentTerms,
    channel: overrides.channel ?? "phone",
    note: overrides.note,
    previousQuoteId: overrides.previousQuoteId,
    createdAt: overrides.createdAt ?? "2026-09-06T10:00:00.000Z",
    updatedAt: overrides.updatedAt ?? "2026-09-06T10:00:00.000Z",
  };
}

test("quoteTotal adds optional extra cost", () => {
  assert.equal(quoteTotal(quote({ priceToman: 120_000, extraCostToman: 15_000 })), 135_000);
  assert.equal(quoteTotal(quote({ priceToman: 120_000 })), 120_000);
});

test("freshness: today", () => {
  const now = new Date("2026-09-06T18:00:00");
  assert.equal(
    getQuoteFreshness(quote({ quotedAt: "2026-09-06T08:00:00" }), now),
    "today"
  );
});

test("freshness: recent through day 3", () => {
  const now = new Date("2026-09-06T12:00:00");
  assert.equal(
    getQuoteFreshness(quote({ quotedAt: "2026-09-03T09:00:00" }), now),
    "recent"
  );
});

test("freshness: stale after day 3", () => {
  const now = new Date("2026-09-06T12:00:00");
  assert.equal(
    getQuoteFreshness(quote({ quotedAt: "2026-09-02T09:00:00" }), now),
    "stale"
  );
});

test("freshness: expired overrides age", () => {
  const now = new Date("2026-09-06T12:00:00Z");
  assert.equal(
    getQuoteFreshness(
      quote({
        quotedAt: "2026-09-06T08:00:00Z",
        validUntil: "2026-09-06T10:00:00Z",
      }),
      now
    ),
    "expired"
  );
});

test("latestQuotesByProvider keeps the newest quote per provider and sorts by total", () => {
  const rows = [
    quote({
      id: "a-old",
      providerId: "a",
      priceToman: 100,
      quotedAt: "2026-09-01T10:00:00Z",
    }),
    quote({
      id: "a-new",
      providerId: "a",
      priceToman: 130,
      quotedAt: "2026-09-04T10:00:00Z",
    }),
    quote({
      id: "b",
      providerId: "b",
      priceToman: 120,
      quotedAt: "2026-09-03T10:00:00Z",
    }),
  ];

  assert.deepEqual(
    latestQuotesByProvider(rows).map((row) => row.id),
    ["b", "a-new"]
  );
});

test("buildCaseMetrics uses only latest provider quotes for min/max but all rows for quote count", () => {
  const rows = [
    quote({ id: "a1", providerId: "a", priceToman: 90, quotedAt: "2026-09-01T10:00:00Z" }),
    quote({ id: "a2", providerId: "a", priceToman: 110, quotedAt: "2026-09-05T10:00:00Z" }),
    quote({ id: "b1", providerId: "b", priceToman: 150, quotedAt: "2026-09-04T10:00:00Z" }),
  ];
  const metrics = buildCaseMetrics(rows);

  assert.equal(metrics.providerCount, 2);
  assert.equal(metrics.quoteCount, 3);
  assert.equal(metrics.minTotal, 110);
  assert.equal(metrics.maxTotal, 150);
  assert.equal(metrics.spread, 40);
});

test("quoteChangePercent measures total-price change", () => {
  const previous = quote({ priceToman: 100_000 });
  const current = quote({ priceToman: 115_000 });
  assert.equal(quoteChangePercent(current, previous), 15);
});
