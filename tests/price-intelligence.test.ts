import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCasePriceIntelligence,
  buildPersonalPriceIntelligence,
  buildSellerPriceIntelligence,
  dailyBestPrices,
  median,
} from "../lib/price-intelligence.ts";
import type { Provider, PurchaseCase, Quote, SellerProfile } from "../lib/types.ts";

const NOW = new Date("2026-09-09T12:00:00+03:30");

function quote(
  id: string,
  caseId: string,
  providerId: string,
  priceToman: number,
  quotedAt: string
): Quote {
  return {
    id,
    caseId,
    providerId,
    priceToman,
    quotedAt,
    channel: "phone",
    createdAt: quotedAt,
    updatedAt: quotedAt,
  };
}

function provider(id: string, caseId: string, sellerProfileId: string, name: string): Provider {
  return {
    id,
    caseId,
    sellerProfileId,
    name,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-09T08:00:00.000Z",
  };
}

function purchaseCase(id: string, title: string, status: PurchaseCase["status"] = "active"): PurchaseCase {
  return {
    id,
    title,
    kind: "product",
    status,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-09T08:00:00.000Z",
  };
}

function seller(id: string, name: string): SellerProfile {
  return {
    id,
    name,
    createdAt: "2026-09-01T08:00:00.000Z",
    updatedAt: "2026-09-09T08:00:00.000Z",
  };
}

test("median supports odd, even and zero values", () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([0, 10, 20, 30]), 15);
  assert.equal(median([]), null);
});

test("daily best prices keep only the cheapest quote for each calendar day", () => {
  const rows = dailyBestPrices([
    quote("q1", "c1", "p1", 110, "2026-09-07T08:00:00.000Z"),
    quote("q2", "c1", "p2", 100, "2026-09-07T09:00:00.000Z"),
    quote("q3", "c1", "p1", 95, "2026-09-08T08:00:00.000Z"),
  ]);
  assert.deepEqual(rows.map((row) => row.totalToman), [100, 95]);
  assert.equal(rows[0].quoteId, "q2");
});

test("case intelligence waits for at least three daily snapshots", () => {
  const result = buildCasePriceIntelligence(
    "c1",
    [
      quote("q1", "c1", "p1", 100, "2026-09-08T08:00:00.000Z"),
      quote("q2", "c1", "p2", 98, "2026-09-09T08:00:00.000Z"),
    ],
    { now: NOW }
  );
  assert.equal(result.snapshotCount, 2);
  assert.equal(result.signal, "insufficient");
  assert.equal(result.confidence, "low");
});

test("fresh current price at the personal low is an excellent signal", () => {
  const result = buildCasePriceIntelligence(
    "c1",
    [
      quote("q1", "c1", "p1", 110, "2026-09-05T08:00:00.000Z"),
      quote("q2", "c1", "p2", 105, "2026-09-06T08:00:00.000Z"),
      quote("q3", "c1", "p1", 100, "2026-09-09T08:00:00.000Z"),
      quote("q4", "c1", "p2", 103, "2026-09-09T08:30:00.000Z"),
    ],
    { now: NOW }
  );
  assert.equal(result.signal, "excellent");
  assert.equal(result.currentBestToman, 100);
  assert.equal(result.historicalMedianToman, 105);
  assert.equal(result.isAtHistoricalLow, true);
  assert.equal(result.confidence, "medium");
});

test("stale current best overrides an otherwise attractive price", () => {
  const result = buildCasePriceIntelligence(
    "c1",
    [
      quote("q1", "c1", "p1", 110, "2026-08-25T08:00:00.000Z"),
      quote("q2", "c1", "p2", 105, "2026-08-26T08:00:00.000Z"),
      quote("q3", "c1", "p1", 90, "2026-08-27T08:00:00.000Z"),
    ],
    { now: NOW }
  );
  assert.equal(result.currentBestFreshness, "stale");
  assert.equal(result.signal, "stale");
});

test("case intelligence detects a high current price compared with its own median", () => {
  const result = buildCasePriceIntelligence(
    "c1",
    [
      quote("q1", "c1", "p1", 90, "2026-09-05T08:00:00.000Z"),
      quote("q2", "c1", "p1", 95, "2026-09-06T08:00:00.000Z"),
      quote("q3", "c1", "p1", 110, "2026-09-09T08:00:00.000Z"),
      quote("q4", "c1", "p2", 112, "2026-09-09T08:30:00.000Z"),
    ],
    { now: NOW }
  );
  assert.equal(result.signal, "high");
  assert.ok((result.currentVsMedianPercent ?? 0) > 5);
});

test("recent windows produce a downward trend when best prices fall", () => {
  const prices = [120, 118, 116, 105, 102, 100];
  const quotes = prices.map((price, index) =>
    quote(
      `q${index}`,
      "c1",
      index % 2 === 0 ? "p1" : "p2",
      price,
      `2026-09-0${index + 4}T08:00:00.000Z`
    )
  );
  const result = buildCasePriceIntelligence("c1", quotes, { now: NOW });
  assert.equal(result.trend, "down");
  assert.ok((result.trendPercent ?? 0) < -2);
  assert.equal(result.confidence, "medium");
});

test("seller price intelligence normalizes prices against the cheapest quote in each case", () => {
  const profiles = [seller("s1", "فروشگاه یک"), seller("s2", "فروشگاه دو")];
  const providers = [
    provider("p11", "c1", "s1", "فروشگاه یک"),
    provider("p12", "c1", "s2", "فروشگاه دو"),
    provider("p21", "c2", "s1", "فروشگاه یک"),
    provider("p22", "c2", "s2", "فروشگاه دو"),
  ];
  const quotes = [
    quote("q11", "c1", "p11", 100, "2026-09-08T08:00:00.000Z"),
    quote("q12", "c1", "p12", 105, "2026-09-08T08:00:00.000Z"),
    quote("q21", "c2", "p21", 200, "2026-09-09T08:00:00.000Z"),
    quote("q22", "c2", "p22", 210, "2026-09-09T08:00:00.000Z"),
  ];
  const result = buildSellerPriceIntelligence(profiles[0], providers, quotes);
  assert.equal(result.comparisonCaseCount, 2);
  assert.equal(result.cheapestCaseCount, 2);
  assert.equal(result.cheapestRate, 1);
  assert.equal(result.medianPremiumPercent, 0);
  assert.equal(result.position, "competitive");
  assert.equal(result.confidence, "medium");
});

test("seller intelligence flags a consistently expensive seller", () => {
  const profiles = [seller("s1", "فروشگاه یک"), seller("s2", "فروشگاه دو")];
  const providers = [
    provider("p11", "c1", "s1", "فروشگاه یک"),
    provider("p12", "c1", "s2", "فروشگاه دو"),
    provider("p21", "c2", "s1", "فروشگاه یک"),
    provider("p22", "c2", "s2", "فروشگاه دو"),
  ];
  const quotes = [
    quote("q11", "c1", "p11", 115, "2026-09-08T08:00:00.000Z"),
    quote("q12", "c1", "p12", 100, "2026-09-08T08:00:00.000Z"),
    quote("q21", "c2", "p21", 230, "2026-09-09T08:00:00.000Z"),
    quote("q22", "c2", "p22", 200, "2026-09-09T08:00:00.000Z"),
  ];
  const result = buildSellerPriceIntelligence(profiles[0], providers, quotes);
  assert.equal(result.position, "high");
  assert.ok((result.medianPremiumPercent ?? 0) > 8);
});

test("personal intelligence finds a fresh active opportunity and competitive seller", () => {
  const cases = [purchaseCase("c1", "تلویزیون"), purchaseCase("c2", "موبایل")];
  const profiles = [seller("s1", "فروشگاه یک"), seller("s2", "فروشگاه دو")];
  const providers = [
    provider("p11", "c1", "s1", "فروشگاه یک"),
    provider("p12", "c1", "s2", "فروشگاه دو"),
    provider("p21", "c2", "s1", "فروشگاه یک"),
    provider("p22", "c2", "s2", "فروشگاه دو"),
  ];
  const quotes = [
    quote("q11a", "c1", "p11", 120, "2026-09-05T08:00:00.000Z"),
    quote("q12a", "c1", "p12", 118, "2026-09-05T08:30:00.000Z"),
    quote("q11b", "c1", "p11", 110, "2026-09-06T08:00:00.000Z"),
    quote("q12b", "c1", "p12", 112, "2026-09-06T08:30:00.000Z"),
    quote("q11c", "c1", "p11", 100, "2026-09-09T08:00:00.000Z"),
    quote("q12c", "c1", "p12", 105, "2026-09-09T08:30:00.000Z"),
    quote("q21a", "c2", "p21", 200, "2026-09-05T08:00:00.000Z"),
    quote("q22a", "c2", "p22", 210, "2026-09-05T08:30:00.000Z"),
    quote("q21b", "c2", "p21", 198, "2026-09-06T08:00:00.000Z"),
    quote("q22b", "c2", "p22", 205, "2026-09-06T08:30:00.000Z"),
    quote("q21c", "c2", "p21", 200, "2026-09-09T08:00:00.000Z"),
    quote("q22c", "c2", "p22", 206, "2026-09-09T08:30:00.000Z"),
  ];
  const result = buildPersonalPriceIntelligence(cases, quotes, providers, profiles, {}, { now: NOW });
  assert.equal(result.eligibleCaseCount, 2);
  assert.equal(result.bestOpportunity?.caseId, "c1");
  assert.equal(result.topCompetitiveSeller?.sellerProfileId, "s1");
  assert.equal(result.topCompetitiveSeller?.comparisonCaseCount, 2);
});
