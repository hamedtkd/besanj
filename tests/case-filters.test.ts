import assert from "node:assert/strict";
import test from "node:test";
import { applyHomeCaseFilters, caseNeedsFollowUp } from "../lib/case-filters.ts";
import type { PurchaseCase, Quote } from "../lib/types.ts";

const now = new Date();
const isoDaysAgo = (days: number) => {
  const value = new Date(now);
  value.setDate(value.getDate() - days);
  return value.toISOString();
};

const cases: PurchaseCase[] = [
  {
    id: "a",
    title: "لپ تاپ شرکت",
    kind: "product",
    status: "active",
    createdAt: isoDaysAgo(3),
    updatedAt: isoDaysAgo(1),
  },
  {
    id: "b",
    title: "ایمپلنت دندان",
    description: "کلینیک غرب تهران",
    kind: "service",
    status: "active",
    createdAt: isoDaysAgo(2),
    updatedAt: now.toISOString(),
  },
];

const quotes: Quote[] = [
  {
    id: "q1",
    caseId: "a",
    providerId: "p1",
    priceToman: 50_000_000,
    quotedAt: isoDaysAgo(6),
    channel: "phone",
    createdAt: isoDaysAgo(6),
    updatedAt: isoDaysAgo(6),
  },
  {
    id: "q2",
    caseId: "b",
    providerId: "p2",
    priceToman: 20_000_000,
    quotedAt: now.toISOString(),
    channel: "instagram",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];

test("caseNeedsFollowUp detects stale latest quote", () => {
  assert.equal(caseNeedsFollowUp([quotes[0]]), true);
  assert.equal(caseNeedsFollowUp([quotes[1]]), false);
});

test("dashboard filters search normalized Persian text", () => {
  const result = applyHomeCaseFilters(cases, quotes, {
    status: "active",
    search: "ايمپلنت",
    kind: "all",
    health: "all",
    sort: "updated",
  });
  assert.deepEqual(result.map((row) => row.id), ["b"]);
});

test("dashboard filters follow-up and kind", () => {
  const result = applyHomeCaseFilters(cases, quotes, {
    status: "active",
    search: "",
    kind: "product",
    health: "followUp",
    sort: "updated",
  });
  assert.deepEqual(result.map((row) => row.id), ["a"]);
});

test("dashboard sort lowest price", () => {
  const result = applyHomeCaseFilters(cases, quotes, {
    status: "active",
    search: "",
    kind: "all",
    health: "all",
    sort: "lowestPrice",
  });
  assert.deepEqual(result.map((row) => row.id), ["b", "a"]);
});
