import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryLabelForCase,
  collectCategoryOptions,
  parseTagsText,
  resolveCategory,
} from "../lib/categories.ts";
import {
  buildBudgetProgress,
  buildMonthlyBudgetSnapshot,
  persianMonthKey,
} from "../lib/budget.ts";
import { applyHomeCaseFilters } from "../lib/case-filters.ts";
import { buildPurchaseInsights } from "../lib/insights.ts";
import type { BudgetPlan, Provider, PurchaseCase, Quote } from "../lib/types.ts";

const cases: PurchaseCase[] = [
  {
    id: "c1",
    title: "لپ تاپ کاری",
    kind: "product",
    status: "decided",
    selectedQuoteId: "q1",
    categoryKey: "digital",
    categoryLabel: "دیجیتال",
    tags: ["کاری", "ضروری"],
    purchaseOutcome: {
      quoteId: "q1",
      status: "received",
      purchasedAt: "2026-09-05T10:00:00.000Z",
      actualPaidToman: 80_000_000,
      updatedAt: "2026-09-05T10:00:00.000Z",
    },
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-05T10:00:00.000Z",
  },
  {
    id: "c2",
    title: "تعمیر خودرو",
    kind: "service",
    status: "decided",
    selectedQuoteId: "q2",
    categoryKey: "auto",
    categoryLabel: "خودرو",
    tags: ["ضروری", "تعمیر"],
    purchaseOutcome: {
      quoteId: "q2",
      status: "ordered",
      purchasedAt: "2026-09-07T10:00:00.000Z",
      actualPaidToman: 25_000_000,
      updatedAt: "2026-09-07T10:00:00.000Z",
    },
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-07T10:00:00.000Z",
  },
  {
    id: "c3",
    title: "کلاس زبان",
    kind: "service",
    status: "active",
    categoryKey: "custom:آموزش",
    categoryLabel: "آموزش",
    tags: ["شخصی"],
    createdAt: "2026-09-08T10:00:00.000Z",
    updatedAt: "2026-09-08T10:00:00.000Z",
  },
];

const providers: Provider[] = [
  {
    id: "p1",
    caseId: "c1",
    name: "فروشنده دیجیتال",
    createdAt: "2026-09-01T10:00:00.000Z",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "p2",
    caseId: "c2",
    name: "تعمیرگاه",
    createdAt: "2026-09-02T10:00:00.000Z",
    updatedAt: "2026-09-02T10:00:00.000Z",
  },
];

const quotes: Quote[] = [
  {
    id: "q1",
    caseId: "c1",
    providerId: "p1",
    priceToman: 82_000_000,
    quotedAt: "2026-09-04T10:00:00.000Z",
    channel: "phone",
    createdAt: "2026-09-04T10:00:00.000Z",
    updatedAt: "2026-09-04T10:00:00.000Z",
  },
  {
    id: "q2",
    caseId: "c2",
    providerId: "p2",
    priceToman: 24_000_000,
    quotedAt: "2026-09-06T10:00:00.000Z",
    channel: "phone",
    createdAt: "2026-09-06T10:00:00.000Z",
    updatedAt: "2026-09-06T10:00:00.000Z",
  },
];

const plan: BudgetPlan = {
  id: "monthly",
  monthlyLimitToman: 120_000_000,
  categoryLimits: {
    digital: 90_000_000,
    auto: 20_000_000,
  },
  updatedAt: "2026-09-08T10:00:00.000Z",
};

test("custom category and tags are normalized and deduplicated", () => {
  const category = resolveCategory("custom", "  آموزش   آنلاین ");
  assert.equal(category.categoryLabel, "آموزش آنلاین");
  assert.equal(category.categoryKey, "custom:آموزش آنلاین");
  assert.deepEqual(parseTagsText("ضروری، کاری, ضروری\nهدیه"), ["ضروری", "کاری", "هدیه"]);
});

test("category options include custom categories from cases", () => {
  const options = collectCategoryOptions(cases);
  assert.ok(options.some((item) => item.key === "digital" && item.label === "دیجیتال"));
  assert.ok(options.some((item) => item.key === "custom:آموزش" && item.label === "آموزش"));
  assert.equal(categoryLabelForCase(cases[2]!), "آموزش");
});

test("dashboard filters by category and tag", () => {
  const result = applyHomeCaseFilters(cases, quotes, {
    status: "decided",
    search: "",
    kind: "all",
    health: "all",
    categoryKey: "auto",
    tag: "ضروری",
    sort: "updated",
  });
  assert.deepEqual(result.map((item) => item.id), ["c2"]);
});

test("budget progress marks near and over limits", () => {
  assert.equal(buildBudgetProgress(80, 100).health, "near");
  assert.equal(buildBudgetProgress(101, 100).health, "over");
  assert.equal(buildBudgetProgress(30, 100).health, "safe");
});

test("monthly budget uses Persian calendar month and category limits", () => {
  const now = new Date("2026-09-08T10:00:00.000Z");
  assert.equal(persianMonthKey(now), "1405-06");
  const snapshot = buildMonthlyBudgetSnapshot(cases, plan, now);
  assert.equal(snapshot.overall.spentToman, 105_000_000);
  assert.equal(snapshot.overall.remainingToman, 15_000_000);
  assert.equal(snapshot.overall.health, "near");
  const auto = snapshot.categories.find((item) => item.categoryKey === "auto");
  if (!auto) throw new Error("دسته خودرو باید در بودجه ماهانه وجود داشته باشد.");
  assert.equal(auto.spentToman, 25_000_000);
  assert.equal(auto.health, "over");
});

test("insights filter by category and expose category spend", () => {
  const filtered = buildPurchaseInsights(cases, quotes, providers, {
    categoryKey: "digital",
  });
  assert.equal(filtered.summary.purchaseCount, 1);
  assert.equal(filtered.summary.totalSpentToman, 80_000_000);
  assert.deepEqual(
    filtered.categorySpend.map((item) => [item.key, item.totalToman]),
    [["digital", 80_000_000]]
  );

  const tagged = buildPurchaseInsights(cases, quotes, providers, { tag: "تعمیر" });
  assert.equal(tagged.summary.purchaseCount, 1);
  assert.equal(tagged.purchases[0]?.caseId, "c2");
});
