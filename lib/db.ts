"use client";

import Dexie, { type EntityTable } from "dexie";
import { sanitizeRequirementChecks } from "@/lib/planning";
import { normalizeTags, resolveCategory } from "@/lib/categories";
import { normalizeBudgetPlan } from "@/lib/budget";
import { normalizeCaseTemplate, templateFromPurchaseCase, templateToCaseInput } from "@/lib/case-templates";
import { snoozeReminderDueAt } from "@/lib/follow-up";
import { cloneRequirementsForNewCase, makeRepeatedCaseTitle } from "@/lib/duplicate-case";
import { normalizePurchaseOutcome, type PurchaseOutcomeInput } from "@/lib/purchase-outcome";
import {
  buildSellerGraph,
  mergeSellerProfileRecords,
  normalizeSellerPhone,
  normalizeSellerProfileInput,
  pickLatestRatedProvider,
} from "@/lib/seller-profiles";
import type {
  BudgetPlan,
  CaseTemplate,
  CaseReminder,
  CaseRequirement,
  Provider,
  PurchaseCase,
  PurchaseKind,
  PurchaseStatus,
  Quote,
  QuoteAttachment,
  QuoteChannel,
  SellerProfile,
} from "@/lib/types";
import { normalizeOptionalText } from "@/lib/validation-rules";

class BesanjDB extends Dexie {
  purchaseCases!: EntityTable<PurchaseCase, "id">;
  providers!: EntityTable<Provider, "id">;
  quotes!: EntityTable<Quote, "id">;
  reminders!: EntityTable<CaseReminder, "id">;
  attachments!: EntityTable<QuoteAttachment, "id">;
  budgetPlans!: EntityTable<BudgetPlan, "id">;
  sellerProfiles!: EntityTable<SellerProfile, "id">;
  caseTemplates!: EntityTable<CaseTemplate, "id">;

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

    this.version(5)
      .stores({
        purchaseCases: "&id, status, kind, createdAt, updatedAt",
        providers: "&id, caseId, name, rating, updatedAt",
        quotes:
          "&id, caseId, providerId, channel, quotedAt, validUntil, [caseId+providerId], [caseId+quotedAt], createdAt, updatedAt",
        reminders:
          "&id, caseId, providerId, quoteId, status, dueAt, [caseId+status], createdAt, updatedAt",
        attachments: "&id, caseId, quoteId, createdAt",
        budgetPlans: "&id, updatedAt",
      })
      .upgrade(async (tx) => {
        const cases = tx.table<PurchaseCase, string>("purchaseCases");
        await cases.toCollection().modify((row) => {
          const category = resolveCategory(row.categoryKey, row.categoryLabel);
          row.categoryKey = category.categoryKey;
          row.categoryLabel = category.categoryLabel;
          row.tags = normalizeTags(row.tags);
        });
      });

    this.version(6)
      .stores({
        purchaseCases: "&id, status, kind, createdAt, updatedAt",
        providers:
          "&id, caseId, sellerProfileId, name, rating, updatedAt, [sellerProfileId+caseId]",
        quotes:
          "&id, caseId, providerId, channel, quotedAt, validUntil, [caseId+providerId], [caseId+quotedAt], createdAt, updatedAt",
        reminders:
          "&id, caseId, providerId, quoteId, status, dueAt, [caseId+status], createdAt, updatedAt",
        attachments: "&id, caseId, quoteId, createdAt",
        budgetPlans: "&id, updatedAt",
        sellerProfiles: "&id, name, phone, updatedAt",
      })
      .upgrade(async (tx) => {
        const providers = tx.table<Provider, string>("providers");
        const sellerProfiles = tx.table<SellerProfile, string>("sellerProfiles");
        const providerRows = await providers.toArray();
        const graph = buildSellerGraph(providerRows, [], {
          makeId,
          now: new Date().toISOString(),
        });

        if (graph.sellerProfiles.length) {
          await sellerProfiles.bulkAdd(graph.sellerProfiles);
        }
        if (graph.providers.length) {
          await providers.bulkPut(
            graph.providers.map((provider) => ({
              ...provider,
              ratingUpdatedAt:
                provider.rating !== undefined
                  ? provider.ratingUpdatedAt ?? provider.updatedAt
                  : undefined,
            }))
          );
        }
      });

    this.version(7).stores({
      purchaseCases: "&id, status, kind, createdAt, updatedAt",
      providers:
        "&id, caseId, sellerProfileId, name, rating, updatedAt, [sellerProfileId+caseId]",
      quotes:
        "&id, caseId, providerId, channel, quotedAt, validUntil, [caseId+providerId], [caseId+quotedAt], createdAt, updatedAt",
      reminders:
        "&id, caseId, providerId, quoteId, status, dueAt, [caseId+status], createdAt, updatedAt",
      attachments: "&id, caseId, quoteId, createdAt",
      budgetPlans: "&id, updatedAt",
      sellerProfiles: "&id, name, phone, updatedAt",
      caseTemplates: "&id, name, kind, categoryKey, updatedAt, lastUsedAt",
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
  categoryKey?: string | null;
  categoryLabel?: string | null;
  tags?: string[];
  requirements?: CaseRequirement[];
}) {
  const now = new Date().toISOString();
  const category = resolveCategory(input.categoryKey, input.categoryLabel);
  const row: PurchaseCase = {
    id: makeId(),
    title: normalizeOptionalText(input.title) ?? "پرونده بدون نام",
    kind: input.kind,
    description: normalizeOptionalText(input.description),
    status: "active",
    targetBudgetToman: normalizeBudget(input.targetBudgetToman),
    categoryKey: category.categoryKey,
    categoryLabel: category.categoryLabel,
    tags: normalizeTags(input.tags),
    requirements: normalizeRequirements(input.requirements),
    createdAt: now,
    updatedAt: now,
  };
  await db.purchaseCases.add(row);
  return row;
}

export async function createCaseTemplate(input: {
  name: string;
  kind: PurchaseKind;
  description?: string;
  targetBudgetToman?: number | null;
  categoryKey?: string | null;
  categoryLabel?: string | null;
  tags?: string[];
  requirementLabels?: string[];
  favorite?: boolean;
}) {
  const row = normalizeCaseTemplate({
    ...input,
    targetBudgetToman: input.targetBudgetToman ?? undefined,
    categoryKey: input.categoryKey ?? undefined,
    categoryLabel: input.categoryLabel ?? undefined,
  });
  await db.caseTemplates.add(row);
  return row;
}

export async function saveCaseAsTemplate(
  caseId: string,
  options?: { name?: string; includeBudget?: boolean }
) {
  const purchaseCase = await db.purchaseCases.get(caseId);
  if (!purchaseCase) throw new Error("پرونده پیدا نشد.");
  const row = templateFromPurchaseCase(purchaseCase, options);
  await db.caseTemplates.add(row);
  return row;
}

export async function updateCaseTemplate(
  id: string,
  patch: Partial<
    Pick<
      CaseTemplate,
      | "name"
      | "kind"
      | "description"
      | "targetBudgetToman"
      | "categoryKey"
      | "categoryLabel"
      | "tags"
      | "requirementLabels"
      | "favorite"
    >
  >
) {
  const current = await db.caseTemplates.get(id);
  if (!current) throw new Error("قالب پیدا نشد.");
  const row = normalizeCaseTemplate({ ...current, ...patch, id: current.id, createdAt: current.createdAt }, {
    id: current.id,
  });
  await db.caseTemplates.put(row);
  return row;
}

export async function deleteCaseTemplate(id: string) {
  await db.caseTemplates.delete(id);
}

export async function markCaseTemplateUsed(id: string) {
  if (id.startsWith("builtin:")) return;
  const current = await db.caseTemplates.get(id);
  if (!current) return;
  const now = new Date().toISOString();
  await db.caseTemplates.update(id, {
    useCount: (current.useCount ?? 0) + 1,
    lastUsedAt: now,
    updatedAt: now,
  });
}

export async function createPurchaseCaseFromTemplate(
  template: CaseTemplate,
  title?: string,
  options?: { trackUsage?: boolean }
) {
  const row = await createPurchaseCase(templateToCaseInput(template, title));
  if (options?.trackUsage !== false) {
    await markCaseTemplateUsed(template.id);
  }
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
      | "categoryKey"
      | "categoryLabel"
      | "tags"
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
  if ("categoryKey" in nextPatch || "categoryLabel" in nextPatch) {
    const category = resolveCategory(nextPatch.categoryKey, nextPatch.categoryLabel);
    nextPatch.categoryKey = category.categoryKey;
    nextPatch.categoryLabel = category.categoryLabel;
  }
  if ("tags" in nextPatch) {
    nextPatch.tags = normalizeTags(nextPatch.tags);
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
  const purchaseCase = await db.purchaseCases.get(caseId);
  if (!purchaseCase) throw new Error("پرونده پیدا نشد.");
  if (purchaseCase.purchaseOutcome && quoteId !== purchaseCase.purchaseOutcome.quoteId) {
    throw new Error("برای تغییر انتخاب نهایی، ابتدا ثبت خرید را پاک یا ویرایش کن.");
  }

  await updatePurchaseCase(caseId, {
    selectedQuoteId: quoteId,
    status: quoteId ? "decided" : "active",
  });
}

export async function setPurchaseOutcome(
  caseId: string,
  input: PurchaseOutcomeInput
) {
  const [purchaseCase, quote] = await Promise.all([
    db.purchaseCases.get(caseId),
    db.quotes.get(input.quoteId),
  ]);
  if (!purchaseCase) throw new Error("پرونده پیدا نشد.");
  if (!quote || quote.caseId !== caseId) {
    throw new Error("استعلام انتخاب‌شده برای این پرونده معتبر نیست.");
  }

  const updatedAt = new Date().toISOString();
  const purchaseOutcome = normalizePurchaseOutcome(input, updatedAt);
  await db.purchaseCases.update(caseId, {
    selectedQuoteId: quote.id,
    status: "decided",
    purchaseOutcome,
    updatedAt,
  });
  return purchaseOutcome;
}

export async function clearPurchaseOutcome(caseId: string) {
  const purchaseCase = await db.purchaseCases.get(caseId);
  if (!purchaseCase) return;
  await db.purchaseCases.update(caseId, {
    purchaseOutcome: undefined,
    updatedAt: new Date().toISOString(),
  });
}

async function resolveSellerProfile(input: {
  sellerProfileId?: string;
  name: string;
  phone?: string;
}) {
  if (input.sellerProfileId) {
    const explicit = await db.sellerProfiles.get(input.sellerProfileId);
    if (explicit) return explicit;
  }

  const profiles = await db.sellerProfiles.toArray();
  const wantedPhone = normalizeSellerPhone(input.phone);
  const wantedName = normalizedComparable(input.name);
  const matched = wantedPhone
    ? profiles.find((profile) => {
        if (normalizeSellerPhone(profile.phone) === wantedPhone) return true;
        return (profile.otherPhones ?? []).some(
          (phone) => normalizeSellerPhone(phone) === wantedPhone
        );
      })
    : profiles.find(
        (profile) =>
          !normalizeSellerPhone(profile.phone) &&
          normalizedComparable(profile.name) === wantedName
      );
  if (matched) return matched;

  const now = new Date().toISOString();
  const normalized = normalizeSellerProfileInput(
    { name: input.name, phone: input.phone },
    now
  );
  const profile: SellerProfile = {
    id: makeId(),
    ...normalized,
    createdAt: now,
  };
  await db.sellerProfiles.add(profile);
  return profile;
}

export async function findOrCreateProvider(input: {
  caseId: string;
  name: string;
  phone?: string;
  sellerProfileId?: string;
}) {
  const providers = await db.providers.where("caseId").equals(input.caseId).toArray();
  const wantedName = normalizedComparable(input.name);
  const wantedPhone = normalizeSellerPhone(input.phone);

  const existing = input.sellerProfileId
    ? providers.find(
        (provider) => provider.sellerProfileId === input.sellerProfileId
      )
    : providers.find((provider) => {
        if (normalizedComparable(provider.name) !== wantedName) return false;
        const existingPhone = normalizeSellerPhone(provider.phone);
        return !wantedPhone || !existingPhone || existingPhone === wantedPhone;
      });

  if (existing) {
    let profile = existing.sellerProfileId
      ? await db.sellerProfiles.get(existing.sellerProfileId)
      : undefined;
    if (!profile) {
      profile = await resolveSellerProfile(input);
    }

    const patch: Partial<Provider> = {};
    if (existing.sellerProfileId !== profile.id) {
      patch.sellerProfileId = profile.id;
    }
    if (existing.name !== profile.name) patch.name = profile.name;
    if (existing.phone !== profile.phone) patch.phone = profile.phone;

    if (Object.keys(patch).length) {
      const updatedAt = new Date().toISOString();
      await db.providers.update(existing.id, { ...patch, updatedAt });
      return { ...existing, ...patch, updatedAt };
    }
    return existing;
  }

  const profile = await resolveSellerProfile(input);
  const now = new Date().toISOString();
  const row: Provider = {
    id: makeId(),
    caseId: input.caseId,
    sellerProfileId: profile.id,
    name: profile.name,
    phone: profile.phone,
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
  const now = new Date().toISOString();
  const normalizedRating =
    rating === null || rating === undefined || !Number.isFinite(rating)
      ? undefined
      : clampRating(rating);
  await db.providers.update(providerId, {
    rating: normalizedRating,
    ratingNote: normalizeOptionalText(ratingNote),
    ratingUpdatedAt: normalizedRating !== undefined ? now : undefined,
    updatedAt: now,
  });
}

export async function updateSellerProfile(
  sellerProfileId: string,
  input: {
    name: string;
    phone?: string | null;
    otherPhones?: string[];
    website?: string;
    instagram?: string;
    telegram?: string;
    whatsapp?: string;
    note?: string;
    favorite?: boolean;
    avoid?: boolean;
  }
) {
  const current = await db.sellerProfiles.get(sellerProfileId);
  if (!current) throw new Error("فروشنده پیدا نشد.");
  const now = new Date().toISOString();
  const normalized = normalizeSellerProfileInput(input, now);
  const next: SellerProfile = {
    id: current.id,
    ...normalized,
    createdAt: current.createdAt,
  };

  await db.transaction("rw", db.sellerProfiles, db.providers, async () => {
    await db.sellerProfiles.put(next);
    await db.providers
      .where("sellerProfileId")
      .equals(sellerProfileId)
      .modify((provider) => {
        provider.name = next.name;
        provider.phone = next.phone;
        provider.updatedAt = now;
      });
  });
  return next;
}

export async function setSellerFavorite(
  sellerProfileId: string,
  favorite: boolean
) {
  const current = await db.sellerProfiles.get(sellerProfileId);
  if (!current) throw new Error("فروشنده پیدا نشد.");
  return updateSellerProfile(sellerProfileId, {
    ...current,
    favorite,
    avoid: favorite ? false : current.avoid,
  });
}

export async function setSellerAvoid(
  sellerProfileId: string,
  avoid: boolean
) {
  const current = await db.sellerProfiles.get(sellerProfileId);
  if (!current) throw new Error("فروشنده پیدا نشد.");
  return updateSellerProfile(sellerProfileId, {
    ...current,
    avoid,
    favorite: avoid ? false : current.favorite,
  });
}

export async function mergeSellerProfiles(
  sourceSellerProfileId: string,
  targetSellerProfileId: string
) {
  if (sourceSellerProfileId === targetSellerProfileId) {
    throw new Error("برای ادغام، دو فروشنده متفاوت انتخاب کن.");
  }

  const [source, target] = await Promise.all([
    db.sellerProfiles.get(sourceSellerProfileId),
    db.sellerProfiles.get(targetSellerProfileId),
  ]);
  if (!source || !target) throw new Error("یکی از فروشنده‌ها پیدا نشد.");

  const relatedProviders = await db.providers
    .where("sellerProfileId")
    .anyOf(sourceSellerProfileId, targetSellerProfileId)
    .toArray();
  const byCase = new Map<string, Provider[]>();
  for (const provider of relatedProviders) {
    const rows = byCase.get(provider.caseId) ?? [];
    rows.push(provider);
    byCase.set(provider.caseId, rows);
  }

  const now = new Date().toISOString();
  const mergedProfile = mergeSellerProfileRecords(target, source, now);

  await db.transaction(
    "rw",
    [db.sellerProfiles, db.providers, db.quotes, db.reminders],
    async () => {
      await db.sellerProfiles.put(mergedProfile);

      for (const rows of byCase.values()) {
        const canonical =
          rows.find(
            (provider) => provider.sellerProfileId === targetSellerProfileId
          ) ?? rows[0];
        const latestRated = pickLatestRatedProvider(rows);

        await db.providers.update(canonical.id, {
          sellerProfileId: targetSellerProfileId,
          name: mergedProfile.name,
          phone: mergedProfile.phone,
          ...(latestRated
            ? {
                rating: latestRated.rating,
                ratingNote: latestRated.ratingNote,
                ratingUpdatedAt:
                  latestRated.ratingUpdatedAt ?? latestRated.updatedAt,
              }
            : {}),
          updatedAt: now,
        });

        for (const duplicate of rows) {
          if (duplicate.id === canonical.id) continue;
          await db.quotes
            .where("providerId")
            .equals(duplicate.id)
            .modify((quote) => {
              quote.providerId = canonical.id;
              quote.updatedAt = now;
            });
          await db.reminders
            .where("providerId")
            .equals(duplicate.id)
            .modify((reminder) => {
              reminder.providerId = canonical.id;
              reminder.updatedAt = now;
            });
          await db.providers.delete(duplicate.id);
        }
      }

      await db.sellerProfiles.delete(sourceSellerProfileId);
    }
  );

  return mergedProfile;
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
  sellerProfileId?: string;
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
    sellerProfileId: input.sellerProfileId,
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
  const purchaseCase = await db.purchaseCases.get(quote.caseId);
  if (purchaseCase?.purchaseOutcome?.quoteId === quoteId) {
    throw new Error("این استعلام به خرید ثبت‌شده وصل است؛ ابتدا ثبت خرید را پاک کن.");
  }

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
      const clearsSelection = purchaseCase?.selectedQuoteId === quoteId;
      await db.purchaseCases.update(quote.caseId, {
        ...(clearsSelection
          ? { selectedQuoteId: undefined, status: "active" as const }
          : {}),
        updatedAt: new Date().toISOString(),
      });
    }
  );
}

export async function duplicatePurchaseCase(input: {
  caseId: string;
  title?: string;
  copyBudget?: boolean;
  copyRequirements?: boolean;
  copyProviders?: boolean;
}) {
  const source = await db.purchaseCases.get(input.caseId);
  if (!source) throw new Error("پرونده پیدا نشد.");

  const sourceProviders = input.copyProviders
    ? await db.providers.where("caseId").equals(source.id).toArray()
    : [];
  const now = new Date().toISOString();
  const caseId = makeId();
  const purchaseCase: PurchaseCase = {
    id: caseId,
    title:
      normalizeOptionalText(input.title) ??
      makeRepeatedCaseTitle(source.title),
    kind: source.kind,
    description: source.description,
    status: "active",
    targetBudgetToman: input.copyBudget === false ? undefined : source.targetBudgetToman,
    categoryKey: source.categoryKey,
    categoryLabel: source.categoryLabel,
    tags: normalizeTags(source.tags),
    requirements:
      input.copyRequirements === false
        ? undefined
        : cloneRequirementsForNewCase(source.requirements, makeId, now),
    createdAt: now,
    updatedAt: now,
  };

  const providers: Provider[] = sourceProviders.map((provider) => ({
    id: makeId(),
    caseId,
    sellerProfileId: provider.sellerProfileId,
    name: provider.name,
    phone: provider.phone,
    rating: provider.rating,
    ratingNote: provider.ratingNote,
    ratingUpdatedAt: provider.ratingUpdatedAt,
    createdAt: now,
    updatedAt: now,
  }));

  await db.transaction("rw", db.purchaseCases, db.providers, async () => {
    await db.purchaseCases.add(purchaseCase);
    if (providers.length) await db.providers.bulkAdd(providers);
  });

  return { purchaseCase, providers };
}


export async function saveBudgetPlan(input: {
  monthlyLimitToman?: number | null;
  categoryLimits?: Record<string, number>;
}) {
  const row = normalizeBudgetPlan({
    id: "monthly",
    monthlyLimitToman: input.monthlyLimitToman ?? undefined,
    categoryLimits: input.categoryLimits,
  });
  await db.budgetPlans.put(row);
  return row;
}

export async function clearBudgetPlan() {
  await db.budgetPlans.delete("monthly");
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

export async function snoozeReminder(id: string, days: number, now = new Date()) {
  const reminder = await db.reminders.get(id);
  if (!reminder) throw new Error("پیگیری پیدا نشد.");
  const dueAt = snoozeReminderDueAt(days, now);
  const updatedAt = now.toISOString();
  await db.transaction("rw", db.reminders, db.purchaseCases, async () => {
    await db.reminders.update(id, {
      dueAt,
      status: "open",
      completedAt: undefined,
      updatedAt,
    });
    await db.purchaseCases.update(reminder.caseId, { updatedAt });
  });
  return dueAt;
}

export async function deleteReminder(id: string) {
  await db.reminders.delete(id);
}

export async function deleteAttachment(id: string) {
  await db.attachments.delete(id);
}
