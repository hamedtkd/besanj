import assert from "node:assert/strict";
import test from "node:test";
import {
  BUILTIN_CASE_TEMPLATES,
  normalizeCaseTemplate,
  requirementsFromTemplate,
  searchCaseTemplates,
  sortCustomTemplates,
  templateFromPurchaseCase,
  templateToCaseInput,
} from "../lib/case-templates.ts";

test("built-in templates cover product and service starting points", () => {
  assert.ok(BUILTIN_CASE_TEMPLATES.length >= 8);
  assert.ok(BUILTIN_CASE_TEMPLATES.some((item) => item.kind === "product"));
  assert.ok(BUILTIN_CASE_TEMPLATES.some((item) => item.kind === "service"));
  assert.ok(BUILTIN_CASE_TEMPLATES.every((item) => item.requirementLabels?.length));
});

test("template normalization deduplicates tags and requirement labels", () => {
  const row = normalizeCaseTemplate(
    {
      name: "  خرید لپ تاپ  ",
      kind: "product",
      categoryKey: "digital",
      tags: ["کاری", "کاری", "ضروری"],
      requirementLabels: ["گارانتی", "گارانتی", "تحویل سریع"],
      targetBudgetToman: 50_000_000,
    },
    { id: "template-1", now: "2026-09-09T00:00:00.000Z" }
  );

  assert.equal(row.id, "template-1");
  assert.equal(row.name, "خرید لپ تاپ");
  assert.deepEqual(row.tags, ["کاری", "ضروری"]);
  assert.deepEqual(row.requirementLabels, ["گارانتی", "تحویل سریع"]);
  assert.equal(row.categoryLabel, "دیجیتال");
  assert.equal(row.targetBudgetToman, 50_000_000);
});

test("template creates fresh requirement ids for every new case", () => {
  let index = 0;
  const template = normalizeCaseTemplate(
    {
      name: "تلویزیون",
      kind: "product",
      requirementLabels: ["گارانتی", "ارسال"],
    },
    { id: "template-tv", now: "2026-09-09T00:00:00.000Z" }
  );
  const first = requirementsFromTemplate(template, {
    now: "2026-09-09T01:00:00.000Z",
    makeId: () => `req-${++index}`,
  });
  const second = requirementsFromTemplate(template, {
    now: "2026-09-09T02:00:00.000Z",
    makeId: () => `req-${++index}`,
  });

  assert.deepEqual(first?.map((item) => item.id), ["req-1", "req-2"]);
  assert.deepEqual(second?.map((item) => item.id), ["req-3", "req-4"]);
});

test("saving a case as template excludes stale budget by default", () => {
  const purchaseCase = {
    id: "case-1",
    title: "یخچال ساید",
    kind: "product" as const,
    status: "active" as const,
    targetBudgetToman: 120_000_000,
    categoryKey: "appliances",
    categoryLabel: "لوازم خانگی",
    tags: ["خانه"],
    requirements: [
      { id: "r-1", label: "گارانتی رسمی", createdAt: "2026-09-09T00:00:00.000Z" },
    ],
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  };

  const withoutBudget = templateFromPurchaseCase(purchaseCase, {
    id: "template-a",
    now: "2026-09-09T01:00:00.000Z",
  });
  const withBudget = templateFromPurchaseCase(purchaseCase, {
    id: "template-b",
    now: "2026-09-09T01:00:00.000Z",
    includeBudget: true,
  });

  assert.equal(withoutBudget.targetBudgetToman, undefined);
  assert.equal(withBudget.targetBudgetToman, 120_000_000);
  assert.deepEqual(withoutBudget.requirementLabels, ["گارانتی رسمی"]);
});

test("template application keeps template data but allows a fresh title", () => {
  const template = normalizeCaseTemplate(
    {
      name: "لپ تاپ",
      kind: "product",
      categoryKey: "digital",
      tags: ["کاری"],
      requirementLabels: ["رم", "گارانتی"],
    },
    { id: "template-laptop", now: "2026-09-09T00:00:00.000Z" }
  );
  const input = templateToCaseInput(template, "لپ تاپ برای دفتر", {
    now: "2026-09-09T02:00:00.000Z",
    makeId: () => "fresh-id",
  });

  assert.equal(input.title, "لپ تاپ برای دفتر");
  assert.equal(input.categoryKey, "digital");
  assert.deepEqual(input.tags, ["کاری"]);
  assert.equal(input.requirements?.[0]?.id, "fresh-id");
});

test("template search includes requirement text and custom templates sort by favorite then usage", () => {
  const searched = searchCaseTemplates(BUILTIN_CASE_TEMPLATES, "رجیستری");
  assert.equal(searched[0]?.id, "builtin:phone");

  const rows = [
    normalizeCaseTemplate({ name: "الف", kind: "product", useCount: 9 }, { id: "a", now: "2026-09-09T00:00:00.000Z" }),
    normalizeCaseTemplate({ name: "ب", kind: "product", favorite: true, useCount: 1 }, { id: "b", now: "2026-09-09T00:00:00.000Z" }),
    normalizeCaseTemplate({ name: "ج", kind: "product", useCount: 3 }, { id: "c", now: "2026-09-09T00:00:00.000Z" }),
  ];
  assert.deepEqual(sortCustomTemplates(rows).map((item) => item.id), ["b", "a", "c"]);
});
