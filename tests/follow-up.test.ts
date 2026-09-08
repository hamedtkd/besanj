import test from "node:test";
import assert from "node:assert/strict";
import { buildDashboardTasks } from "../lib/follow-up.ts";
import type { CaseReminder, PurchaseCase, Quote } from "../lib/types.ts";

const purchaseCase: PurchaseCase = {
  id: "case-1",
  title: "لپ‌تاپ",
  kind: "product",
  status: "active",
  createdAt: "2026-09-01T08:00:00Z",
  updatedAt: "2026-09-08T08:00:00Z",
};

function quote(id: string, overrides: Partial<Quote> = {}): Quote {
  return {
    id,
    caseId: "case-1",
    providerId: id,
    priceToman: 100_000,
    quotedAt: "2026-09-08T08:00:00Z",
    channel: "phone",
    createdAt: "2026-09-08T08:00:00Z",
    updatedAt: "2026-09-08T08:00:00Z",
    ...overrides,
  };
}

test("dashboard queue includes due reminder and ready-to-decide case", () => {
  const reminder: CaseReminder = {
    id: "r1",
    caseId: "case-1",
    title: "تماس دوباره",
    dueAt: "2026-09-08T20:00:00Z",
    status: "open",
    createdAt: "2026-09-07T08:00:00Z",
    updatedAt: "2026-09-07T08:00:00Z",
  };
  const tasks = buildDashboardTasks(
    [purchaseCase],
    [quote("q1"), quote("q2", { priceToman: 110_000 })],
    [reminder],
    new Date("2026-09-08T10:00:00Z")
  );
  assert.equal(tasks.some((item) => item.kind === "reminder"), true);
  assert.equal(tasks.some((item) => item.kind === "ready"), true);
});

test("dashboard queue surfaces stale active cases", () => {
  const tasks = buildDashboardTasks(
    [purchaseCase],
    [quote("q1", { quotedAt: "2026-08-20T08:00:00Z" })],
    [],
    new Date("2026-09-08T10:00:00Z")
  );
  assert.equal(tasks.some((item) => item.kind === "stale"), true);
});

test("dashboard queue surfaces quote expiring tomorrow", () => {
  const tasks = buildDashboardTasks(
    [purchaseCase],
    [quote("q1", { validUntil: "2026-09-09T23:59:59Z" })],
    [],
    new Date("2026-09-08T10:00:00Z")
  );
  assert.equal(tasks.some((item) => item.kind === "expiring"), true);
});

test("dashboard queue keeps the declared calendar day across ISO offsets", () => {
  const tasks = buildDashboardTasks(
    [purchaseCase],
    [quote("q1", { validUntil: "2026-09-09T23:59:59-04:00" })],
    [],
    new Date("2026-09-08T10:00:00Z")
  );
  assert.equal(tasks.some((item) => item.kind === "expiring"), true);
});

test("dashboard queue surfaces overdue delivery for an ordered purchase", () => {
  const orderedCase: PurchaseCase = {
    ...purchaseCase,
    status: "decided",
    selectedQuoteId: "q1",
    purchaseOutcome: {
      quoteId: "q1",
      status: "ordered",
      purchasedAt: "2026-09-06T23:59:59.999Z",
      actualPaidToman: 100_000,
      expectedDeliveryAt: "2026-09-07T23:59:59.999Z",
      updatedAt: "2026-09-06T10:00:00.000Z",
    },
  };
  const tasks = buildDashboardTasks(
    [orderedCase],
    [quote("q1")],
    [],
    new Date("2026-09-08T10:00:00Z")
  );
  const delivery = tasks.find((item) => item.kind === "delivery");
  assert.ok(delivery);
  assert.equal(delivery.priority, "urgent");
});
