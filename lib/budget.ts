import { categoryLabelForCase, categoryLabelForKey } from "./categories.ts";
import type { BudgetPlan, PurchaseCase } from "./types.ts";

export const DEFAULT_BUDGET_PLAN_ID = "monthly";
export const BUDGET_NEAR_RATIO = 0.8;

export type BudgetHealth = "safe" | "near" | "over" | "none";

export interface BudgetProgress {
  limitToman: number | null;
  spentToman: number;
  remainingToman: number | null;
  ratio: number | null;
  health: BudgetHealth;
}

export interface CategoryBudgetProgress extends BudgetProgress {
  categoryKey: string;
  categoryLabel: string;
  purchaseCount: number;
}

export interface MonthlyBudgetSnapshot {
  monthKey: string;
  monthLabel: string;
  overall: BudgetProgress;
  purchaseCount: number;
  categories: CategoryBudgetProgress[];
}

function cleanPositiveMoney(value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(value) || value <= 0) {
    return undefined;
  }
  return Math.round(value);
}

export function normalizeCategoryLimits(value?: Record<string, number> | null) {
  if (!value || typeof value !== "object") return undefined;
  const entries = Object.entries(value)
    .map(([key, limit]) => [key.trim(), cleanPositiveMoney(limit)] as const)
    .filter((entry): entry is readonly [string, number] => Boolean(entry[0] && entry[1]));
  return entries.length ? Object.fromEntries(entries) : undefined;
}

export function normalizeBudgetPlan(
  value?: Partial<BudgetPlan> | null,
  updatedAt = new Date().toISOString()
): BudgetPlan {
  return {
    id: DEFAULT_BUDGET_PLAN_ID,
    monthlyLimitToman: cleanPositiveMoney(value?.monthlyLimitToman),
    categoryLimits: normalizeCategoryLimits(value?.categoryLimits),
    updatedAt,
  };
}

function dateForStoredDay(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
    if (!Number.isNaN(date.getTime())) return date;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function persianParts(value: Date) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(value);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  if (!year || !month) return null;
  return { year, month };
}

export function persianMonthKey(value: Date | string) {
  const date = typeof value === "string" ? dateForStoredDay(value) : value;
  if (!date) return null;
  const parts = persianParts(date);
  return parts ? `${parts.year}-${parts.month.padStart(2, "0")}` : null;
}

export function persianMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "long",
  }).format(value);
}

export function buildBudgetProgress(spentToman: number, limitToman?: number | null): BudgetProgress {
  const limit = cleanPositiveMoney(limitToman) ?? null;
  if (!limit) {
    return {
      limitToman: null,
      spentToman: Math.max(0, Math.round(spentToman)),
      remainingToman: null,
      ratio: null,
      health: "none",
    };
  }

  const spent = Math.max(0, Math.round(spentToman));
  const ratio = spent / limit;
  return {
    limitToman: limit,
    spentToman: spent,
    remainingToman: limit - spent,
    ratio,
    health: ratio > 1 ? "over" : ratio >= BUDGET_NEAR_RATIO ? "near" : "safe",
  };
}

export function buildMonthlyBudgetSnapshot(
  cases: PurchaseCase[],
  plan?: BudgetPlan | null,
  now = new Date()
): MonthlyBudgetSnapshot {
  const normalizedPlan = normalizeBudgetPlan(plan, plan?.updatedAt ?? now.toISOString());
  const currentMonthKey = persianMonthKey(now) ?? "";
  const categorySpent = new Map<string, { label: string; spent: number; count: number }>();
  let totalSpent = 0;
  let purchaseCount = 0;

  for (const purchaseCase of cases) {
    const outcome = purchaseCase.purchaseOutcome;
    if (!outcome || persianMonthKey(outcome.purchasedAt) !== currentMonthKey) continue;
    totalSpent += outcome.actualPaidToman;
    purchaseCount += 1;
    if (!purchaseCase.categoryKey) continue;
    const current = categorySpent.get(purchaseCase.categoryKey) ?? {
      label: categoryLabelForCase(purchaseCase),
      spent: 0,
      count: 0,
    };
    current.spent += outcome.actualPaidToman;
    current.count += 1;
    categorySpent.set(purchaseCase.categoryKey, current);
  }

  const categoryKeys = new Set([
    ...Object.keys(normalizedPlan.categoryLimits ?? {}),
    ...categorySpent.keys(),
  ]);
  const categories = Array.from(categoryKeys)
    .map((categoryKey) => {
      const spent = categorySpent.get(categoryKey);
      const progress = buildBudgetProgress(
        spent?.spent ?? 0,
        normalizedPlan.categoryLimits?.[categoryKey]
      );
      return {
        categoryKey,
        categoryLabel: spent?.label ?? categoryLabelForKey(categoryKey),
        purchaseCount: spent?.count ?? 0,
        ...progress,
      };
    })
    .sort((left, right) => {
      if (left.health === "over" && right.health !== "over") return -1;
      if (right.health === "over" && left.health !== "over") return 1;
      return right.spentToman - left.spentToman;
    });

  return {
    monthKey: currentMonthKey,
    monthLabel: persianMonthLabel(now),
    overall: buildBudgetProgress(totalSpent, normalizedPlan.monthlyLimitToman),
    purchaseCount,
    categories,
  };
}
