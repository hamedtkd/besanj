import type { PurchaseCase } from "./types.ts";

export const BUILTIN_CATEGORY_KEYS = [
  "appliances",
  "digital",
  "health",
  "auto",
  "services",
  "home",
  "travel",
  "other",
] as const;

export type BuiltInCategoryKey = (typeof BUILTIN_CATEGORY_KEYS)[number];

export const BUILTIN_CATEGORIES: Array<{
  key: BuiltInCategoryKey;
  label: string;
}> = [
  { key: "appliances", label: "لوازم خانگی" },
  { key: "digital", label: "دیجیتال" },
  { key: "health", label: "درمان" },
  { key: "auto", label: "خودرو" },
  { key: "services", label: "خدمات" },
  { key: "home", label: "خانه" },
  { key: "travel", label: "سفر" },
  { key: "other", label: "سایر" },
];

export const NO_CATEGORY_KEY = "uncategorized";
export const CUSTOM_CATEGORY_VALUE = "custom";
export const MAX_CASE_TAGS = 8;
export const MAX_TAG_LENGTH = 28;
export const MAX_CATEGORY_LABEL_LENGTH = 40;

const categoryLabelByKey = new Map(
  BUILTIN_CATEGORIES.map((category) => [category.key, category.label])
);

function normalizeIdentity(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
    .replace(/\s+/g, " ");
}

function cleanLabel(value?: string | null, maxLength = MAX_CATEGORY_LABEL_LENGTH) {
  const normalized = (value ?? "").trim().replace(/\s+/g, " ");
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

export function isBuiltInCategoryKey(value?: string | null): value is BuiltInCategoryKey {
  return Boolean(value && categoryLabelByKey.has(value as BuiltInCategoryKey));
}

export function customCategoryKey(label: string) {
  return `custom:${normalizeIdentity(label)}`;
}

export function resolveCategory(
  categoryKey?: string | null,
  customLabel?: string | null
): { categoryKey?: string; categoryLabel?: string } {
  if (!categoryKey || categoryKey === NO_CATEGORY_KEY) return {};
  if (isBuiltInCategoryKey(categoryKey)) {
    return {
      categoryKey,
      categoryLabel: categoryLabelByKey.get(categoryKey),
    };
  }

  const label = cleanLabel(customLabel ?? (categoryKey.startsWith("custom:") ? categoryKey.slice(7) : ""));
  if (!label) return {};
  return {
    categoryKey: customCategoryKey(label),
    categoryLabel: label,
  };
}

export function categoryLabelForKey(categoryKey?: string | null, fallbackLabel?: string | null) {
  if (isBuiltInCategoryKey(categoryKey)) {
    return categoryLabelByKey.get(categoryKey) ?? "بدون دسته";
  }
  return cleanLabel(fallbackLabel ?? (categoryKey?.startsWith("custom:") ? categoryKey.slice(7) : "")) ?? "بدون دسته";
}

export function categoryLabelForCase(purchaseCase: Pick<PurchaseCase, "categoryKey" | "categoryLabel">) {
  return categoryLabelForKey(purchaseCase.categoryKey, purchaseCase.categoryLabel);
}

export function parseTagsText(value?: string | null) {
  const rows = (value ?? "")
    .split(/[\n,،]+/)
    .map((item) => cleanLabel(item, MAX_TAG_LENGTH))
    .filter((item): item is string => Boolean(item));

  const seen = new Set<string>();
  const tags: string[] = [];
  for (const tag of rows) {
    const key = normalizeIdentity(tag);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    tags.push(tag);
    if (tags.length >= MAX_CASE_TAGS) break;
  }
  return tags;
}

export function normalizeTags(value?: string[] | null) {
  if (!Array.isArray(value)) return undefined;
  const tags = parseTagsText(value.join("\n"));
  return tags.length ? tags : undefined;
}

export function tagsToText(tags?: string[] | null) {
  return normalizeTags(tags)?.join("، ") ?? "";
}

export interface CategoryOption {
  key: string;
  label: string;
  custom?: boolean;
}

export function collectCategoryOptions(
  cases: Array<Pick<PurchaseCase, "categoryKey" | "categoryLabel">>,
  options?: { includeUncategorized?: boolean }
) {
  const rows: CategoryOption[] = BUILTIN_CATEGORIES.map((category) => ({ ...category }));
  const seen = new Set(rows.map((row) => row.key));

  for (const purchaseCase of cases) {
    if (!purchaseCase.categoryKey || seen.has(purchaseCase.categoryKey)) continue;
    const label = categoryLabelForCase(purchaseCase);
    if (label === "بدون دسته") continue;
    seen.add(purchaseCase.categoryKey);
    rows.push({ key: purchaseCase.categoryKey, label, custom: true });
  }

  if (options?.includeUncategorized) {
    rows.push({ key: NO_CATEGORY_KEY, label: "بدون دسته" });
  }

  return rows;
}

export function collectTagOptions(cases: Array<Pick<PurchaseCase, "tags">>) {
  const rows: string[] = [];
  const seen = new Set<string>();
  for (const purchaseCase of cases) {
    for (const tag of normalizeTags(purchaseCase.tags) ?? []) {
      const key = normalizeIdentity(tag);
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(tag);
    }
  }
  return rows.sort((left, right) => left.localeCompare(right, "fa"));
}

export function caseMatchesTag(purchaseCase: Pick<PurchaseCase, "tags">, tag: string) {
  const wanted = normalizeIdentity(tag);
  return (normalizeTags(purchaseCase.tags) ?? []).some(
    (item) => normalizeIdentity(item) === wanted
  );
}
