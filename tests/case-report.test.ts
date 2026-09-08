import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCaseReportSnapshot,
  buildCaseReportText,
  buildCaseTimeline,
} from "../lib/case-report.ts";
import type { CaseReminder, Provider, PurchaseCase, Quote } from "../lib/types.ts";

const purchaseCase: PurchaseCase = {
  id: "case-1",
  title: "لپ‌تاپ",
  kind: "product",
  status: "active",
  selectedQuoteId: "quote-2",
  targetBudgetToman: 80_000_000,
  requirements: [{ id: "req-1", label: "گارانتی", createdAt: "2026-09-01T08:00:00Z" }],
  createdAt: "2026-09-01T08:00:00Z",
  updatedAt: "2026-09-04T08:00:00Z",
};

const providers: Provider[] = [
  { id: "p1", caseId: "case-1", name: "الف", createdAt: "2026-09-01T09:00:00Z", updatedAt: "2026-09-01T09:00:00Z" },
  { id: "p2", caseId: "case-1", name: "ب", createdAt: "2026-09-01T10:00:00Z", updatedAt: "2026-09-01T10:00:00Z" },
];

const quotes: Quote[] = [
  {
    id: "quote-1", caseId: "case-1", providerId: "p1", priceToman: 76_000_000,
    quotedAt: "2026-09-02T08:00:00Z", channel: "phone", requirementChecks: { "req-1": true },
    createdAt: "2026-09-02T08:05:00Z", updatedAt: "2026-09-02T08:05:00Z",
  },
  {
    id: "quote-2", caseId: "case-1", providerId: "p2", priceToman: 74_000_000,
    quotedAt: "2026-09-03T08:00:00Z", channel: "whatsapp", requirementChecks: { "req-1": true },
    createdAt: "2026-09-03T08:05:00Z", updatedAt: "2026-09-03T08:05:00Z",
  },
];

const reminders: CaseReminder[] = [
  {
    id: "r1", caseId: "case-1", title: "پیگیری تخفیف", dueAt: "2026-09-05T12:00:00Z",
    status: "open", createdAt: "2026-09-03T09:00:00Z", updatedAt: "2026-09-03T09:00:00Z",
  },
];

test("case report sorts latest provider quotes by total and marks selection", () => {
  const report = buildCaseReportSnapshot(purchaseCase, providers, quotes, reminders, [
    { id: "a1", quoteId: "quote-2" },
  ]);
  assert.equal(report.rows[0]?.provider.name, "ب");
  assert.equal(report.rows[0]?.selected, true);
  assert.equal(report.rows[0]?.attachmentCount, 1);
  assert.equal(report.selectedRow?.quote.id, "quote-2");
});

test("case report text includes Persian price and selected provider", () => {
  const report = buildCaseReportSnapshot(purchaseCase, providers, quotes, reminders, []);
  const text = buildCaseReportText(report);
  assert.equal(text.includes("گزارش بسنج — لپ‌تاپ"), true);
  assert.equal(text.includes("۷۴٬۰۰۰٬۰۰۰ تومان"), true);
  assert.equal(text.includes("انتخاب نهایی: ب"), true);
});

test("timeline places current decision and newer events first", () => {
  const timeline = buildCaseTimeline(purchaseCase, providers, quotes, reminders, [
    { id: "a1", quoteId: "quote-1", fileName: "offer.pdf", createdAt: "2026-09-03T10:00:00Z" },
  ]);
  assert.equal(timeline[0]?.kind, "decision");
  assert.equal(timeline.some((item) => item.kind === "attachment"), true);
  assert.equal(timeline.at(-1)?.title, "پرونده ساخته شد");
});

test("report keeps a historical selected quote even when a newer quote exists", () => {
  const historicalCase = { ...purchaseCase, selectedQuoteId: "quote-1" };
  const newerQuote: Quote = {
    id: "quote-3", caseId: "case-1", providerId: "p1", priceToman: 78_000_000,
    quotedAt: "2026-09-04T08:00:00Z", channel: "phone",
    createdAt: "2026-09-04T08:05:00Z", updatedAt: "2026-09-04T08:05:00Z",
  };
  const report = buildCaseReportSnapshot(
    historicalCase,
    providers,
    [...quotes, newerQuote],
    reminders,
    []
  );
  assert.equal(report.rows.some((row) => row.quote.id === "quote-1"), false);
  assert.equal(report.selectedRow?.quote.id, "quote-1");
});

test("report and timeline include the recorded purchase outcome", () => {
  const completedCase: PurchaseCase = {
    ...purchaseCase,
    status: "decided",
    purchaseOutcome: {
      quoteId: "quote-2",
      status: "received",
      purchasedAt: "2026-09-05T23:59:59.999Z",
      actualPaidToman: 73_500_000,
      orderReference: "INV-99",
      receivedAt: "2026-09-07T23:59:59.999Z",
      updatedAt: "2026-09-07T15:00:00.000Z",
    },
    updatedAt: "2026-09-07T15:00:00.000Z",
  };
  const report = buildCaseReportSnapshot(completedCase, providers, quotes, reminders, []);
  const text = buildCaseReportText(report);
  const timeline = buildCaseTimeline(completedCase, providers, quotes, reminders, []);
  assert.equal(report.purchaseRow?.quote.id, "quote-2");
  assert.equal(text.includes("نتیجه خرید: دریافت شده"), true);
  assert.equal(text.includes("۷۳٬۵۰۰٬۰۰۰ تومان"), true);
  assert.equal(timeline.some((item) => item.kind === "purchase"), true);
});
