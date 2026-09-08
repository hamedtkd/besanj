import { getQuoteFreshness, buildCaseMetrics } from "./quote.ts";
import { caseMatchesTag } from "./categories.ts";
import type { PurchaseCase, PurchaseKind, PurchaseStatus, Quote } from "./types.ts";

export type HomeCaseKindFilter = "all" | PurchaseKind;
export type HomeCaseHealthFilter = "all" | "followUp" | "withQuotes" | "withoutQuotes";
export type HomeCaseSort = "updated" | "quotes" | "lowestPrice" | "newestQuote";

export interface HomeCaseFilterState {
  status: PurchaseStatus;
  search: string;
  kind: HomeCaseKindFilter;
  health: HomeCaseHealthFilter;
  categoryKey?: string;
  tag?: string;
  sort: HomeCaseSort;
}

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

export function caseNeedsFollowUp(quotes: Quote[]) {
  const metrics = buildCaseMetrics(quotes);
  return metrics.latestQuotes.some((quote) => {
    const freshness = getQuoteFreshness(quote);
    return freshness === "stale" || freshness === "expired";
  });
}

export function applyHomeCaseFilters(
  cases: PurchaseCase[],
  quotes: Quote[],
  filters: HomeCaseFilterState
) {
  const quoteMap = new Map<string, Quote[]>();
  for (const quote of quotes) {
    const rows = quoteMap.get(quote.caseId) ?? [];
    rows.push(quote);
    quoteMap.set(quote.caseId, rows);
  }

  const search = normalizeSearch(filters.search);

  return cases
    .filter((purchaseCase) => purchaseCase.status === filters.status)
    .filter((purchaseCase) => {
      if (filters.kind !== "all" && purchaseCase.kind !== filters.kind) return false;
      if (filters.categoryKey && filters.categoryKey !== "all") {
        if (filters.categoryKey === "uncategorized") {
          if (purchaseCase.categoryKey) return false;
        } else if (purchaseCase.categoryKey !== filters.categoryKey) {
          return false;
        }
      }
      if (filters.tag && filters.tag !== "all" && !caseMatchesTag(purchaseCase, filters.tag)) {
        return false;
      }

      const caseQuotes = quoteMap.get(purchaseCase.id) ?? [];
      if (filters.health === "followUp" && !caseNeedsFollowUp(caseQuotes)) return false;
      if (filters.health === "withQuotes" && caseQuotes.length === 0) return false;
      if (filters.health === "withoutQuotes" && caseQuotes.length > 0) return false;

      if (!search) return true;
      const haystack = normalizeSearch(
        [
          purchaseCase.title,
          purchaseCase.description ?? "",
          purchaseCase.categoryLabel ?? "",
          ...(purchaseCase.tags ?? []),
          ...(purchaseCase.requirements ?? []).map((item) => item.label),
        ].join(" ")
      );
      return haystack.includes(search);
    })
    .sort((left, right) => {
      const leftQuotes = quoteMap.get(left.id) ?? [];
      const rightQuotes = quoteMap.get(right.id) ?? [];
      const leftMetrics = buildCaseMetrics(leftQuotes);
      const rightMetrics = buildCaseMetrics(rightQuotes);

      if (filters.sort === "quotes") {
        return rightMetrics.quoteCount - leftMetrics.quoteCount;
      }

      if (filters.sort === "lowestPrice") {
        const leftPrice = leftMetrics.minTotal ?? Number.POSITIVE_INFINITY;
        const rightPrice = rightMetrics.minTotal ?? Number.POSITIVE_INFINITY;
        if (leftPrice !== rightPrice) return leftPrice - rightPrice;
      }

      if (filters.sort === "newestQuote") {
        const leftDate = leftMetrics.latestQuotedAt
          ? new Date(leftMetrics.latestQuotedAt).getTime()
          : 0;
        const rightDate = rightMetrics.latestQuotedAt
          ? new Date(rightMetrics.latestQuotedAt).getTime()
          : 0;
        if (leftDate !== rightDate) return rightDate - leftDate;
      }

      return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
    });
}
