import test from "node:test";
import assert from "node:assert/strict";
import { EMPTY_QUOTE_FILTERS, activeFilterCount, filterQuotes } from "../lib/quote-filters.ts";
import type { Provider, Quote, QuoteFilterState } from "../lib/types.ts";

const providers: Provider[] = [
  { id: "a", caseId: "case", name: "فروشگاه آلفا", phone: "09120000000", createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" },
  { id: "b", caseId: "case", name: "کلینیک بتا", createdAt: "2026-09-01T00:00:00Z", updatedAt: "2026-09-01T00:00:00Z" },
];

function quote(id: string, providerId: string, overrides: Partial<Quote> = {}): Quote {
  return {
    id,
    caseId: "case",
    providerId,
    priceToman: overrides.priceToman ?? 100_000,
    extraCostToman: overrides.extraCostToman,
    quotedAt: overrides.quotedAt ?? "2026-09-06T10:00:00Z",
    validUntil: overrides.validUntil,
    deliveryDays: overrides.deliveryDays,
    warranty: overrides.warranty,
    paymentTerms: overrides.paymentTerms,
    channel: overrides.channel ?? "phone",
    contactRef: overrides.contactRef,
    note: overrides.note,
    previousQuoteId: overrides.previousQuoteId,
    createdAt: overrides.createdAt ?? "2026-09-06T10:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-09-06T10:00:00Z",
  };
}

const rows = [
  quote("a", "a", { priceToman: 120_000, channel: "instagram", warranty: "۱۸ ماه", deliveryDays: 1, contactRef: "@alpha" }),
  quote("b", "b", { priceToman: 90_000, channel: "telegram", deliveryDays: 5, quotedAt: "2026-09-01T10:00:00Z" }),
];

function withPatch(patch: Partial<QuoteFilterState>): QuoteFilterState {
  return { ...EMPTY_QUOTE_FILTERS, ...patch };
}

test("filters by channel and warranty", () => {
  const filtered = filterQuotes(rows, providers, withPatch({ channel: "instagram", warranty: "with" }), new Date("2026-09-06T12:00:00Z"));
  assert.deepEqual(filtered.map((row) => row.id), ["a"]);
});

test("search includes provider and contact reference", () => {
  const filtered = filterQuotes(rows, providers, withPatch({ search: "@alpha" }));
  assert.deepEqual(filtered.map((row) => row.id), ["a"]);
});

test("delivery and price filters are enforced", () => {
  const filtered = filterQuotes(rows, providers, withPatch({ maxDeliveryDays: 3, maxPriceToman: 130_000 }));
  assert.deepEqual(filtered.map((row) => row.id), ["a"]);
});

test("provider filter isolates one seller", () => {
  const filtered = filterQuotes(rows, providers, withPatch({ providerId: "b" }));
  assert.deepEqual(filtered.map((row) => row.id), ["b"]);
});

test("activeFilterCount ignores default state", () => {
  assert.equal(activeFilterCount(EMPTY_QUOTE_FILTERS), 0);
  assert.equal(activeFilterCount(withPatch({ channel: "telegram", sort: "newest" })), 2);
});
