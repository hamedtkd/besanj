import type { CaseRequirement, PurchaseCase, Quote } from "./types.ts";
import { quoteTotal } from "./quote.ts";

export const MAX_CASE_REQUIREMENTS = 12;

function normalizeRequirementLabel(value: string) {
  return value
    .trim()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

export function parseRequirementLines(value: string) {
  const seen = new Set<string>();
  const labels: string[] = [];

  for (const raw of value.split(/\r?\n|،|,/)) {
    const label = normalizeRequirementLabel(raw);
    if (!label) continue;
    const key = label.toLocaleLowerCase("fa-IR");
    if (seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
    if (labels.length >= MAX_CASE_REQUIREMENTS) break;
  }

  return labels;
}

export function requirementsToText(requirements?: CaseRequirement[]) {
  return (requirements ?? []).map((item) => item.label).join("\n");
}

export function mergeRequirements(
  existing: CaseRequirement[] | undefined,
  text: string,
  now = new Date().toISOString()
) {
  const byLabel = new Map(
    (existing ?? []).map((item) => [normalizeRequirementLabel(item.label).toLocaleLowerCase("fa-IR"), item])
  );

  return parseRequirementLines(text).map((label) => {
    const previous = byLabel.get(label.toLocaleLowerCase("fa-IR"));
    if (previous) return { ...previous, label };
    return {
      id: crypto.randomUUID(),
      label,
      createdAt: now,
    } satisfies CaseRequirement;
  });
}

export function sanitizeRequirementChecks(
  checks: Record<string, boolean> | undefined,
  requirements?: CaseRequirement[]
) {
  const allowed = new Set((requirements ?? []).map((item) => item.id));
  const next: Record<string, boolean> = {};
  for (const [id, value] of Object.entries(checks ?? {})) {
    if (allowed.has(id) && value === true) next[id] = true;
  }
  return next;
}

export function requirementMatchSummary(
  quote: Pick<Quote, "requirementChecks">,
  requirements?: CaseRequirement[]
) {
  const total = requirements?.length ?? 0;
  if (!total) return { matched: 0, total: 0, ratio: 1, evaluated: false };
  const evaluated = quote.requirementChecks !== undefined;
  const matched = requirements!.filter((item) => quote.requirementChecks?.[item.id] === true).length;
  return { matched, total, ratio: matched / total, evaluated };
}

export type BudgetState = "none" | "within" | "near" | "over";

export function getBudgetState(
  purchaseCase: Pick<PurchaseCase, "targetBudgetToman">,
  quote: Pick<Quote, "priceToman" | "extraCostToman">
): BudgetState {
  const budget = purchaseCase.targetBudgetToman;
  if (!budget || budget <= 0) return "none";
  const total = quoteTotal(quote);
  if (total <= budget) return "within";
  if (total <= budget * 1.1) return "near";
  return "over";
}

export function budgetDifference(
  targetBudgetToman: number | undefined,
  totalToman: number
) {
  if (!targetBudgetToman || targetBudgetToman <= 0) return null;
  return totalToman - targetBudgetToman;
}
