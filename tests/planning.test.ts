import test from "node:test";
import assert from "node:assert/strict";
import {
  getBudgetState,
  parseRequirementLines,
  requirementMatchSummary,
} from "../lib/planning.ts";
import type { CaseRequirement, Quote } from "../lib/types.ts";

const requirements: CaseRequirement[] = [
  { id: "warranty", label: "گارانتی رسمی", createdAt: "2026-09-08T00:00:00Z" },
  { id: "delivery", label: "تحویل سریع", createdAt: "2026-09-08T00:00:00Z" },
];

function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: "q1",
    caseId: "c1",
    providerId: "p1",
    priceToman: 100_000,
    quotedAt: "2026-09-08T08:00:00Z",
    channel: "phone",
    createdAt: "2026-09-08T08:00:00Z",
    updatedAt: "2026-09-08T08:00:00Z",
    ...overrides,
  };
}

test("requirements parser trims, deduplicates and accepts Persian comma", () => {
  assert.deepEqual(parseRequirementLines("گارانتی رسمی\nتحویل سریع، گارانتی رسمی"), [
    "گارانتی رسمی",
    "تحویل سریع",
  ]);
});

test("requirement match summary counts checked requirements", () => {
  const summary = requirementMatchSummary(
    quote({ requirementChecks: { warranty: true } }),
    requirements
  );
  assert.equal(summary.matched, 1);
  assert.equal(summary.total, 2);
  assert.equal(summary.ratio, 0.5);
});

test("budget state distinguishes within, near and over", () => {
  assert.equal(getBudgetState({ targetBudgetToman: 100_000 }, quote({ priceToman: 90_000 })), "within");
  assert.equal(getBudgetState({ targetBudgetToman: 100_000 }, quote({ priceToman: 105_000 })), "near");
  assert.equal(getBudgetState({ targetBudgetToman: 100_000 }, quote({ priceToman: 120_000 })), "over");
});
