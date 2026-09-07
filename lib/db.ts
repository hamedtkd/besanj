"use client";

import Dexie, { type EntityTable } from "dexie";
import type {
  Provider,
  PurchaseCase,
  PurchaseKind,
  PurchaseStatus,
  Quote,
  QuoteChannel,
} from "@/lib/types";
import { normalizeOptionalText } from "@/lib/validation-rules";

class BesanjDB extends Dexie {
  purchaseCases!: EntityTable<PurchaseCase, "id">;
  providers!: EntityTable<Provider, "id">;
  quotes!: EntityTable<Quote, "id">;

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

export async function createPurchaseCase(input: {
  title: string;
  kind: PurchaseKind;
  description?: string;
}) {
  const now = new Date().toISOString();
  const row: PurchaseCase = {
    id: makeId(),
    title: normalizeOptionalText(input.title) ?? "پرونده بدون نام",
    kind: input.kind,
    description: normalizeOptionalText(input.description),
    status: "active",
    createdAt: now,
    updatedAt: now,
  };
  await db.purchaseCases.add(row);
  return row;
}

export async function updatePurchaseCase(
  id: string,
  patch: Partial<Pick<PurchaseCase, "title" | "description" | "kind" | "status" | "selectedQuoteId">>
) {
  const nextPatch = { ...patch };
  if ("title" in nextPatch && nextPatch.title !== undefined) {
    nextPatch.title = normalizeOptionalText(nextPatch.title) ?? "پرونده بدون نام";
  }
  if ("description" in nextPatch) {
    nextPatch.description = normalizeOptionalText(nextPatch.description);
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
  previousQuoteId?: string;
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
    previousQuoteId: input.previousQuoteId,
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction("rw", db.quotes, db.purchaseCases, async () => {
    await db.quotes.add(row);
    await db.purchaseCases.update(input.caseId, { updatedAt: now });
  });

  return { quote: row, provider };
}

export async function deleteQuote(quoteId: string) {
  const quote = await db.quotes.get(quoteId);
  if (!quote) return;
  await db.transaction("rw", db.quotes, db.purchaseCases, async () => {
    await db.quotes.delete(quoteId);
    await db.purchaseCases.update(quote.caseId, { updatedAt: new Date().toISOString() });
  });
}
