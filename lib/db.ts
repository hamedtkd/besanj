"use client";

import Dexie, { type EntityTable } from "dexie";
import { sanitizeRequirementChecks } from "@/lib/planning";
import type {
  CaseReminder,
  CaseRequirement,
  Provider,
  PurchaseCase,
  PurchaseKind,
  PurchaseStatus,
  Quote,
  QuoteAttachment,
  QuoteChannel,
} from "@/lib/types";
import { normalizeOptionalText } from "@/lib/validation-rules";

class BesanjDB extends Dexie {
  purchaseCases!: EntityTable<PurchaseCase, "id">;
  providers!: EntityTable<Provider, "id">;
  quotes!: EntityTable<Quote, "id">;
  reminders!: EntityTable<CaseReminder, "id">;
  attachments!: EntityTable<QuoteAttachment, "id">;

  constructor() {
    super("estelamkoo-local");
    this.version(1).stores({
      purchaseCases: "&id, status, kind, createdAt, updatedAt",
      providers: "&id, caseId, name, updatedAt",
      quotes: "&id, caseId, providerId, quotedAt, validUntil, createdAt, updatedAt",
    });
    this.version(2).stores({
      purchaseCases: "&id, status, kind, createdAt, updatedAt",
      providers: "&id, caseId, name, updatedAt",
      quotes:
        "&id, caseId, providerId, channel, quotedAt, validUntil, [caseId+providerId], [caseId+quotedAt], createdAt, updatedAt",
    });
    this.version(3)
      .stores({
        purchaseCases: "&id, status, kind, createdAt, updatedAt",
        providers: "&id, caseId, name, updatedAt",
        quotes:
          "&id, caseId, providerId, channel, quotedAt, validUntil, [caseId+providerId], [caseId+quotedAt], createdAt, updatedAt",
      })
      .upgrade(async (tx) => {
        const cases = tx.table<PurchaseCase, string>("purchaseCases");
        const providers = tx.table<Provider, string>("providers");
        const quotes = tx.table<Quote, string>("quotes");

        await cases.toCollection().modify((row) => {
          row.title = normalizeOptionalText(row.title) ?? "پرونده بدون نام";
          row.description = normalizeOptionalText(row.description);
        });

        await providers.toCollection().modify((row) => {
          row.name = normalizeOptionalText(row.name) ?? "فروشنده بدون نام";
          row.phone = normalizeOptionalText(row.phone);
        });

        await quotes.toCollection().modify((row) => {
          row.validUntil = normalizeOptionalText(row.validUntil);
          row.warranty = normalizeOptionalText(row.warranty);
          row.paymentTerms = normalizeOptionalText(row.paymentTerms);
          row.contactRef = normalizeOptionalText(row.contactRef);
          row.note = normalizeOptionalText(row.note);
          if (row.extraCostToman === null) row.extraCostToman = undefined;
          if (row.deliveryDays === null) row.deliveryDays = undefined;
        });
      });

    this.version(4)
      .stores({
        purchaseCases: "&id, status, kind, createdAt, updatedAt",
        providers: "&id, caseId, name, rating, updatedAt",
        quotes:
          "&id, caseId, providerId, channel, quotedAt, validUntil, [caseId+providerId], [caseId+quotedAt], createdAt, updatedAt",
        reminders:
          "&id, caseId, providerId, quoteId, status, dueAt, [caseId+status], createdAt, updatedAt",
        attachments: "&id, caseId, quoteId, createdAt",
      })
      .upgrade(async (tx) => {
        const cases = tx.table<PurchaseCase, string>("purchaseCases");
        const providers = tx.table<Provider, string>("providers");
        const quotes = tx.table<Quote, string>("quotes");

        await cases.toCollection().modify((row) => {
          if (row.targetBudgetToman === null || !Number.isFinite(row.targetBudgetToman)) {
            row.targetBudgetToman = undefined;
          }
          row.requirements = normalizeRequirements(row.requirements);
        });

        await providers.toCollection().modify((row) => {
          if (row.rating === null || !Number.isFinite(row.rating)) row.rating = undefined;
          if (row.rating !== undefined) row.rating = clampRating(row.rating);
          row.ratingNote = normalizeOptionalText(row.ratingNote);
        });

        await quotes.toCollection().modify((row) => {
          if (!row.requirementChecks || typeof row.requirementChecks !== "object") {
            row.requirementChecks = undefined;
          }
        });
      });
  }
}

export const db = new BesanjDB();

function makeId() {
  return crypto.randomUUID();
}

function normalizedComparable(value?: string) {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
    .replace(/\s+/g, " ");
}

function normalizedPhone(value?: string) {
  return (value ?? "").replace(/\D/g, "");
}

function clampRating(value: number) {
  return Math.min(5, Math.max(1, Math.round(value)));
}

function normalizeRequirements(value?: CaseRequirement[]) {
  if (!Array.isArray(value)) return undefined;
  const seen = new Set<string>();
  const rows = value
    .map((item) => ({
      id: normalizeOptionalText(item?.id) ?? makeId(),
      label: normalizeOptionalText(item?.label),
      createdAt: normalizeOptionalText(item?.createdAt) ?? new Date().toISOString(),
    }))
    .filter((item): item is CaseRequirement => Boolean(item.label))
    .filter((item) => {
      const key = item.label.toLocaleLowerCase("fa-IR");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 12);
  return rows.length ? rows : undefined;
}

function normalizeBudget(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.round(value);
}

export async function createPurchaseCase(input: {
  title: string;
  kind: PurchaseKind;
  description?: string;
  targetBudgetToman?: number | null;
  requirements?: CaseRequirement[];
}) {
  const now = new Date().toISOString();
  const row: PurchaseCase = {
    id: makeId(),
    title: normalizeOptionalText(input.title) ?? "پرونده بدون نام",
    kind: input.kind,
    description: normalizeOptionalText(input.description),
    status: "active",
    targetBudgetToman: normalizeBudget(input.targetBudgetToman),
    requirements: normalizeRequirements(input.requirements),
    createdAt: now,
    updatedAt: now,
  };
  await db.purchaseCases.add(row);
  return row;
}

export async function updatePurchaseCase(
  id: string,
  patch: Partial<
    Pick<
      PurchaseCase,
      | "title"
      | "description"
      | "kind"
      | "status"
      | "selectedQuoteId"
      | "targetBudgetToman"
      | "requirements"
    >
  >
) {
  const nextPatch = { ...patch };
  if ("title" in nextPatch && nextPatch.title !== undefined) {
    nextPatch.title = normalizeOptionalText(nextPatch.title) ?? "پرونده بدون نام";
  }
  if ("description" in nextPatch) {
    nextPatch.description = normalizeOptionalText(nextPatch.description);
  }
  if ("targetBudgetToman" in nextPatch) {
    nextPatch.targetBudgetToman = normalizeBudget(nextPatch.targetBudgetToman);
  }
  if ("requirements" in nextPatch) {
    nextPatch.requirements = normalizeRequirements(nextPatch.requirements);
  }

  await db.purchaseCases.update(id, {
    ...nextPatch,
    updatedAt: new Date().toISOString(),
  });
}

export async function setPurchaseStatus(id: string, status: PurchaseStatus) {
  await updatePurchaseCase(id, { status });
}

export async function selectQuote(caseId: string, quoteId?: string) {
  await updatePurchaseCase(caseId, {
    selectedQuoteId: quoteId,
    status: quoteId ? "decided" : "active",
  });
}

export async function findOrCreateProvider(input: {
  caseId: string;
  name: string;
  phone?: string;
}) {
  const providers = await db.providers.where("caseId").equals(input.caseId).toArray();
  const wantedName = normalizedComparable(input.name);
  const wantedPhone = normalizedPhone(input.phone);

  const existing = providers.find((provider) => {
    if (normalizedComparable(provider.name) !== wantedName) return false;
    const existingPhone = normalizedPhone(provider.phone);
    return !wantedPhone || !existingPhone || existingPhone === wantedPhone;
  });

  if (existing) {
    const phone = normalizeOptionalText(input.phone);
    if (phone && phone !== existing.phone) {
      const updatedAt = new Date().toISOString();
      await db.providers.update(existing.id, { phone, updatedAt });
      return { ...existing, phone, updatedAt };
    }
    return existing;
  }

  const now = new Date().toISOString();
  const row: Provider = {
    id: makeId(),
    caseId: input.caseId,
    name: normalizeOptionalText(input.name) ?? "فروشنده بدون نام",
    phone: normalizeOptionalText(input.phone),
    createdAt: now,
    updatedAt: now,
  };
  await db.providers.add(row);
  return row;
}

export async function updateProviderRating(
  providerId: string,
  rating?: number | null,
  ratingNote?: string
) {
  await db.providers.update(providerId, {
    rating:
      rating === null || rating === undefined || !Number.isFinite(rating)
        ? undefined
        : clampRating(rating),
    ratingNote: normalizeOptionalText(ratingNote),
    updatedAt: new Date().toISOString(),
  });
}

export interface NewQuoteAttachmentInput {
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
}

export async function addQuote(input: {
  caseId: string;
  providerName: string;
  phone?: string;
  priceToman: number;
  extraCostToman?: number | null;
  quotedAt: string;
  validUntil?: string;
  deliveryDays?: number | null;
  warranty?: string;
  paymentTerms?: string;
  channel: QuoteChannel;
  contactRef?: string;
  note?: string;
  requirementChecks?: Record<string, boolean>;
  previousQuoteId?: string;
  attachments?: NewQuoteAttachmentInput[];
}) {
  const purchaseCase = await db.purchaseCases.get(input.caseId);
  if (!purchaseCase) throw new Error("پرونده پیدا نشد.");

  const provider = await findOrCreateProvider({
    caseId: input.caseId,
    name: input.providerName,
    phone: input.phone,
  });

  const now = new Date().toISOString();
  const row: Quote = {
    id: makeId(),
    caseId: input.caseId,
    providerId: provider.id,
    priceToman: Math.round(input.priceToman),
    extraCostToman:
      input.extraCostToman === null || input.extraCostToman === undefined
        ? undefined
        : Math.round(input.extraCostToman),
    quotedAt: input.quotedAt,
    validUntil: normalizeOptionalText(input.validUntil),
    deliveryDays:
      input.deliveryDays === null || input.deliveryDays === undefined
        ? undefined
        : Math.round(input.deliveryDays),
    warranty: normalizeOptionalText(input.warranty),
    paymentTerms: normalizeOptionalText(input.paymentTerms),
    channel: input.channel,
    contactRef: normalizeOptionalText(input.contactRef),
    note: normalizeOptionalText(input.note),
    requirementChecks: sanitizeRequirementChecks(
      input.requirementChecks,
      purchaseCase.requirements
    ),
    previousQuoteId: input.previousQuoteId,
    createdAt: now,
    updatedAt: now,
  };

  const attachments: QuoteAttachment[] = (input.attachments ?? []).map((file) => ({
    id: makeId(),
    caseId: input.caseId,
    quoteId: row.id,
    fileName: normalizeOptionalText(file.fileName) ?? "پیوست",
    mimeType: normalizeOptionalText(file.mimeType) ?? "application/octet-stream",
    size: Math.max(0, Math.round(file.size)),
    blob: file.blob,
    createdAt: now,
  }));

  await db.transaction(
    "rw",
    db.quotes,
    db.purchaseCases,
    db.attachments,
    async () => {
      await db.quotes.add(row);
      if (attachments.length) await db.attachments.bulkAdd(attachments);
      await db.purchaseCases.update(input.caseId, { updatedAt: now });
    }
  );

  return { quote: row, provider, attachments };
}

export async function deleteQuote(quoteId: string) {
  const quote = await db.quotes.get(quoteId);
  if (!quote) return;
  await db.transaction(
    "rw",
    db.quotes,
    db.purchaseCases,
    db.attachments,
    db.reminders,
    async () => {
      await db.attachments.where("quoteId").equals(quoteId).delete();
      await db.reminders.where("quoteId").equals(quoteId).delete();
      await db.quotes.delete(quoteId);
      await db.purchaseCases.update(quote.caseId, {
        updatedAt: new Date().toISOString(),
      });
    }
  );
}

export async function createReminder(input: {
  caseId: string;
  title: string;
  dueAt: string;
  providerId?: string;
  quoteId?: string;
}) {
  const purchaseCase = await db.purchaseCases.get(input.caseId);
  if (!purchaseCase) throw new Error("پرونده پیدا نشد.");

  const title = normalizeOptionalText(input.title);
  if (!title) throw new Error("عنوان پیگیری را وارد کن.");

  const now = new Date().toISOString();
  const row: CaseReminder = {
    id: makeId(),
    caseId: input.caseId,
    providerId: normalizeOptionalText(input.providerId),
    quoteId: normalizeOptionalText(input.quoteId),
    title,
    dueAt: input.dueAt,
    status: "open",
    createdAt: now,
    updatedAt: now,
  };
  await db.transaction("rw", db.reminders, db.purchaseCases, async () => {
    await db.reminders.add(row);
    await db.purchaseCases.update(input.caseId, { updatedAt: now });
  });
  return row;
}

export async function setReminderDone(id: string, done: boolean) {
  const reminder = await db.reminders.get(id);
  if (!reminder) return;
  const now = new Date().toISOString();
  await db.reminders.update(id, {
    status: done ? "done" : "open",
    completedAt: done ? now : undefined,
    updatedAt: now,
  });
}

export async function deleteReminder(id: string) {
  await db.reminders.delete(id);
}

export async function deleteAttachment(id: string) {
  await db.attachments.delete(id);
}
