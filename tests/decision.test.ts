import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_DECISION_PREFERENCES, scoreQuotesForDecision } from "../lib/decision.ts";
import type { Quote } from "../lib/types.ts";

function quote(id: string, priceToman: number, overrides: Partial<Quote> = {}): Quote {
  return {
    id,
    caseId: "case",
    providerId: overrides.providerId ?? id,
    priceToman,
    extraCostToman: overrides.extraCostToman,
    quotedAt: overrides.quotedAt ?? "2026-09-06T08:00:00Z",
    validUntil: overrides.validUntil,
    deliveryDays: overrides.deliveryDays,
    warranty: overrides.warranty,
    paymentTerms: overrides.paymentTerms,
    channel: overrides.channel ?? "phone",
    contactRef: overrides.contactRef,
    note: overrides.note,
    previousQuoteId: overrides.previousQuoteId,
    createdAt: "2026-09-06T08:00:00Z",
    updatedAt: "2026-09-06T08:00:00Z",
  };
}

test("cheapest profile ranks the cheaper otherwise-similar quote first", () => {
  const rows = [
    quote("cheap", 100_000, { deliveryDays: 2 }),
    quote("expensive", 150_000, { deliveryDays: 2 }),
  ];
  const result = scoreQuotesForDecision(rows, { ...DEFAULT_DECISION_PREFERENCES, profile: "cheapest" }, new Date("2026-09-06T12:00:00Z"));
  assert.equal(result[0].quoteId, "cheap");
});

test("hard budget marks expensive quote ineligible", () => {
  const rows = [quote("a", 100_000), quote("b", 200_000)];
  const result = scoreQuotesForDecision(rows, { ...DEFAULT_DECISION_PREFERENCES, maxBudgetToman: 150_000 }, new Date("2026-09-06T12:00:00Z"));
  assert.equal(result.find((item) => item.quoteId === "b")?.eligible, false);
});

test("requireFresh rejects stale quote", () => {
  const rows = [
    quote("fresh", 120_000),
    quote("stale", 90_000, { quotedAt: "2026-08-20T08:00:00Z" }),
  ];
  const result = scoreQuotesForDecision(rows, { ...DEFAULT_DECISION_PREFERENCES, requireFresh: true }, new Date("2026-09-06T12:00:00Z"));
  assert.equal(result.find((item) => item.quoteId === "stale")?.eligible, false);
  assert.equal(result[0].quoteId, "fresh");
});

test("provider rating can break an otherwise equal decision tie", () => {
  const rows = [
    quote("a", 100_000, { providerId: "provider-a", deliveryDays: 2 }),
    quote("b", 100_000, { providerId: "provider-b", deliveryDays: 2 }),
  ];
  const result = scoreQuotesForDecision(
    rows,
    DEFAULT_DECISION_PREFERENCES,
    new Date("2026-09-06T12:00:00Z"),
    { providerRatings: { "provider-a": 5, "provider-b": 2 } }
  );
  assert.equal(result[0].quoteId, "a");
});

test("requirement coverage improves otherwise equal score", () => {
  const requirements = [
    { id: "r1", label: "گارانتی", createdAt: "2026-09-01T00:00:00Z" },
    { id: "r2", label: "تحویل سریع", createdAt: "2026-09-01T00:00:00Z" },
  ];
  const rows = [
    quote("a", 100_000, { requirementChecks: { r1: true, r2: true } }),
    quote("b", 100_000, { requirementChecks: { r1: true } }),
  ];
  const result = scoreQuotesForDecision(
    rows,
    DEFAULT_DECISION_PREFERENCES,
    new Date("2026-09-06T12:00:00Z"),
    { requirements }
  );
  assert.equal(result[0].quoteId, "a");
});
