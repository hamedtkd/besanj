import { normalizeTags, resolveCategory } from "./categories.ts";
import type { CaseRequirement, CaseTemplate, PurchaseCase, PurchaseKind } from "./types.ts";
import { normalizeOptionalText } from "./validation-rules.ts";

export type TemplateSource = "builtIn" | "custom";

export interface CaseTemplateOption extends CaseTemplate {
  source: TemplateSource;
  descriptionShort?: string;
}

export const BUILTIN_CASE_TEMPLATES: CaseTemplateOption[] = [
  {
    id: "builtin:laptop",
    name: "لپ‌تاپ",
    source: "builtIn",
    kind: "product",
    categoryKey: "digital",
    categoryLabel: "دیجیتال",
    tags: ["دیجیتال"],
    requirementLabels: ["مدل دقیق", "رم و حافظه", "گارانتی معتبر", "زمان تحویل"],
    descriptionShort: "برای مقایسه مدل، مشخصات، گارانتی و تحویل",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "builtin:phone",
    name: "موبایل",
    source: "builtIn",
    kind: "product",
    categoryKey: "digital",
    categoryLabel: "دیجیتال",
    tags: ["دیجیتال"],
    requirementLabels: ["حافظه و رنگ", "رجیستری", "گارانتی معتبر", "زمان تحویل"],
    descriptionShort: "برای قیمت گرفتن مدل، حافظه، رجیستری و گارانتی",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "builtin:tv",
    name: "تلویزیون",
    source: "builtIn",
    kind: "product",
    categoryKey: "appliances",
    categoryLabel: "لوازم خانگی",
    tags: ["خانه"],
    requirementLabels: ["مدل دقیق", "سایز صفحه", "گارانتی", "هزینه و زمان ارسال"],
    descriptionShort: "برای مقایسه مدل، سایز، گارانتی و ارسال",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "builtin:appliance",
    name: "لوازم خانگی",
    source: "builtIn",
    kind: "product",
    categoryKey: "appliances",
    categoryLabel: "لوازم خانگی",
    tags: ["خانه"],
    requirementLabels: ["مدل و ظرفیت", "گارانتی رسمی", "هزینه حمل", "نصب و زمان تحویل"],
    descriptionShort: "برای یخچال، لباسشویی، ظرفشویی و وسایل مشابه",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "builtin:car",
    name: "خودرو",
    source: "builtIn",
    kind: "product",
    categoryKey: "auto",
    categoryLabel: "خودرو",
    tags: ["خودرو"],
    requirementLabels: ["مدل و تیپ", "سال ساخت", "کارکرد یا وضعیت", "شرایط پرداخت و تحویل"],
    descriptionShort: "برای مقایسه قیمت و شرایط خرید خودرو",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "builtin:medical",
    name: "درمان و پزشکی",
    source: "builtIn",
    kind: "service",
    categoryKey: "health",
    categoryLabel: "درمان",
    tags: ["درمان"],
    requirementLabels: ["روش یا خدمت دقیق", "هزینه نهایی", "تعداد جلسات", "زمان انجام و پیگیری"],
    descriptionShort: "برای دندانپزشکی، درمان، آزمایش و خدمات پزشکی",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "builtin:home-service",
    name: "تعمیر و خدمات خانه",
    source: "builtIn",
    kind: "service",
    categoryKey: "services",
    categoryLabel: "خدمات",
    tags: ["خانه", "خدمات"],
    requirementLabels: ["شرح دقیق کار", "هزینه قطعات", "دستمزد", "زمان شروع و پایان"],
    descriptionShort: "برای تعمیرکار، نصب، سرویس و کارهای خانه",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "builtin:travel",
    name: "سفر و اقامت",
    source: "builtIn",
    kind: "service",
    categoryKey: "travel",
    categoryLabel: "سفر",
    tags: ["سفر"],
    requirementLabels: ["تاریخ و مدت", "شرایط لغو", "خدمات شامل‌شده", "هزینه نهایی"],
    descriptionShort: "برای هتل، تور، اقامت و خدمات سفر",
    createdAt: "2026-09-09T00:00:00.000Z",
    updatedAt: "2026-09-09T00:00:00.000Z",
  },
];

function normalizeRequirementLabels(value?: string[]) {
  if (!Array.isArray(value)) return undefined;
  const rows: string[] = [];
  const seen = new Set<string>();
  for (const raw of value) {
    const label = normalizeOptionalText(raw);
    if (!label) continue;
    const key = label.toLocaleLowerCase("fa-IR");
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(label.slice(0, 90));
    if (rows.length >= 12) break;
  }
  return rows.length ? rows : undefined;
}

function normalizeBudget(value?: number | null) {
  if (value === null || value === undefined || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.round(value);
}

export function normalizeCaseTemplate(
  input: Partial<CaseTemplate> & Pick<CaseTemplate, "name" | "kind">,
  options?: { id?: string; now?: string }
): CaseTemplate {
  const now = options?.now ?? new Date().toISOString();
  const category = resolveCategory(input.categoryKey, input.categoryLabel);
  return {
    id: options?.id ?? input.id ?? crypto.randomUUID(),
    name: normalizeOptionalText(input.name)?.slice(0, 80) ?? "قالب بدون نام",
    kind: input.kind === "service" ? "service" : "product",
    description: normalizeOptionalText(input.description)?.slice(0, 600),
    targetBudgetToman: normalizeBudget(input.targetBudgetToman),
    categoryKey: category.categoryKey,
    categoryLabel: category.categoryLabel,
    tags: normalizeTags(input.tags),
    requirementLabels: normalizeRequirementLabels(input.requirementLabels),
    favorite: Boolean(input.favorite) || undefined,
    useCount:
      input.useCount !== undefined && Number.isFinite(input.useCount) && input.useCount > 0
        ? Math.floor(input.useCount)
        : undefined,
    lastUsedAt: normalizeOptionalText(input.lastUsedAt),
    createdAt: normalizeOptionalText(input.createdAt) ?? now,
    updatedAt: now,
  };
}

export function templateFromPurchaseCase(
  purchaseCase: PurchaseCase,
  options?: { id?: string; name?: string; now?: string; includeBudget?: boolean }
) {
  return normalizeCaseTemplate(
    {
      name: options?.name ?? purchaseCase.title,
      kind: purchaseCase.kind,
      description: purchaseCase.description,
      targetBudgetToman: options?.includeBudget ? purchaseCase.targetBudgetToman : undefined,
      categoryKey: purchaseCase.categoryKey,
      categoryLabel: purchaseCase.categoryLabel,
      tags: purchaseCase.tags,
      requirementLabels: purchaseCase.requirements?.map((item) => item.label),
    },
    { id: options?.id, now: options?.now }
  );
}

export function requirementsFromTemplate(
  template: Pick<CaseTemplate, "requirementLabels">,
  options?: { now?: string; makeId?: () => string }
): CaseRequirement[] | undefined {
  const labels = normalizeRequirementLabels(template.requirementLabels);
  if (!labels?.length) return undefined;
  const now = options?.now ?? new Date().toISOString();
  const makeId = options?.makeId ?? (() => crypto.randomUUID());
  return labels.map((label) => ({ id: makeId(), label, createdAt: now }));
}

export function templateToCaseInput(
  template: CaseTemplate,
  title?: string,
  options?: { now?: string; makeId?: () => string }
) {
  return {
    title: normalizeOptionalText(title) ?? template.name,
    kind: template.kind as PurchaseKind,
    description: template.description,
    targetBudgetToman: template.targetBudgetToman,
    categoryKey: template.categoryKey,
    categoryLabel: template.categoryLabel,
    tags: template.tags,
    requirements: requirementsFromTemplate(template, options),
  };
}

export function sortCustomTemplates(rows: CaseTemplate[]) {
  return [...rows].sort((left, right) => {
    const favorite = Number(Boolean(right.favorite)) - Number(Boolean(left.favorite));
    if (favorite) return favorite;
    const usage = (right.useCount ?? 0) - (left.useCount ?? 0);
    if (usage) return usage;
    return (right.lastUsedAt ?? right.updatedAt).localeCompare(left.lastUsedAt ?? left.updatedAt);
  });
}

export function searchCaseTemplates(rows: CaseTemplateOption[], query: string) {
  const wanted = query
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک");
  if (!wanted) return rows;
  return rows.filter((row) => {
    const haystack = [
      row.name,
      row.categoryLabel,
      row.description,
      row.descriptionShort,
      ...(row.tags ?? []),
      ...(row.requirementLabels ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("fa-IR")
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک");
    return haystack.includes(wanted);
  });
}

export function asTemplateOption(row: CaseTemplate): CaseTemplateOption {
  return { ...row, source: "custom" };
}
