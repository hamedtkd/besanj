import { requirementMatchSummary } from "./planning.ts";
import { getQuoteFreshness, quoteTotal } from "./quote.ts";
import type {
  CaseRequirement,
  DecisionPreferences,
  DecisionProfile,
  DecisionResult,
  Quote,
} from "./types.ts";

const PROFILE_WEIGHTS: Record<
  DecisionProfile,
  { price: number; delivery: number; freshness: number; warranty: number }
> = {
  balanced: { price: 0.45, delivery: 0.2, freshness: 0.2, warranty: 0.15 },
  cheapest: { price: 0.7, delivery: 0.1, freshness: 0.1, warranty: 0.1 },
  fastest: { price: 0.3, delivery: 0.45, freshness: 0.15, warranty: 0.1 },
  freshest: { price: 0.3, delivery: 0.15, freshness: 0.45, warranty: 0.1 },
  warranty: { price: 0.3, delivery: 0.15, freshness: 0.15, warranty: 0.4 },
};

export const DEFAULT_DECISION_PREFERENCES: DecisionPreferences = {
  profile: "balanced",
  maxBudgetToman: null,
  maxDeliveryDays: null,
  requireFresh: false,
};

export interface DecisionContext {
  providerRatings?: Record<string, number | undefined>;
  requirements?: CaseRequirement[];
}

function inverseScale(value: number, min: number, max: number) {
  if (max <= min) return 100;
  return Math.max(0, Math.min(100, ((max - value) / (max - min)) * 100));
}

function freshnessScore(quote: Quote, now: Date) {
  const freshness = getQuoteFreshness(quote, now);
  if (freshness === "today") return 100;
  if (freshness === "recent") return 82;
  if (freshness === "stale") return 32;
  return 0;
}

export function scoreQuotesForDecision(
  quotes: Quote[],
  preferences: DecisionPreferences,
  now = new Date(),
  context: DecisionContext = {}
): DecisionResult[] {
  if (!quotes.length) return [];

  const totals = quotes.map(quoteTotal);
  const deliveryValues = quotes
    .map((quote) => quote.deliveryDays)
    .filter((value): value is number => value !== undefined);
  const minTotal = Math.min(...totals);
  const maxTotal = Math.max(...totals);
  const minDelivery = deliveryValues.length ? Math.min(...deliveryValues) : 0;
  const maxDelivery = deliveryValues.length ? Math.max(...deliveryValues) : 0;
  const weights = PROFILE_WEIGHTS[preferences.profile];

  return quotes
    .map((quote) => {
      const total = quoteTotal(quote);
      const freshness = getQuoteFreshness(quote, now);
      const eligible =
        (preferences.maxBudgetToman === null || total <= preferences.maxBudgetToman) &&
        (preferences.maxDeliveryDays === null ||
          (quote.deliveryDays !== undefined &&
            quote.deliveryDays <= preferences.maxDeliveryDays)) &&
        (!preferences.requireFresh || freshness === "today" || freshness === "recent");

      const price = inverseScale(total, minTotal, maxTotal);
      const delivery =
        quote.deliveryDays === undefined
          ? 35
          : inverseScale(quote.deliveryDays, minDelivery, maxDelivery);
      const freshnessValue = freshnessScore(quote, now);
      const warranty = quote.warranty ? 100 : 35;
      const baseScore =
        price * weights.price +
        delivery * weights.delivery +
        freshnessValue * weights.freshness +
        warranty * weights.warranty;

      const requirementSummary = requirementMatchSummary(
        quote,
        context.requirements
      );
      const requirementScore = requirementSummary.total
        ? requirementSummary.evaluated
          ? requirementSummary.ratio * 100
          : 60
        : 100;
      const providerRating = context.providerRatings?.[quote.providerId];
      const providerScore = providerRating
        ? Math.max(0, Math.min(100, (providerRating / 5) * 100))
        : 60;
      const score = baseScore * 0.78 + requirementScore * 0.12 + providerScore * 0.1;

      const reasons: string[] = [];
      if (total === minTotal) reasons.push("کمترین قیمت بین گزینه‌های منتخب");
      if (quote.deliveryDays !== undefined && quote.deliveryDays === minDelivery) {
        reasons.push(quote.deliveryDays === 0 ? "تحویل فوری" : "سریع‌ترین تحویل");
      }
      if (requirementSummary.total && requirementSummary.evaluated && requirementSummary.matched === requirementSummary.total) {
        reasons.push("همه شرط‌های ثبت‌شده را پوشش می‌دهد");
      } else if (requirementSummary.total && requirementSummary.evaluated && requirementSummary.matched > 0) {
        reasons.push(
          `${requirementSummary.matched.toLocaleString("fa-IR-u-nu-arabext")} از ${requirementSummary.total.toLocaleString("fa-IR-u-nu-arabext")} شرط را پوشش می‌دهد`
        );
      }
      if (providerRating && providerRating >= 4) {
        reasons.push(`امتیاز اعتماد ${providerRating.toLocaleString("fa-IR-u-nu-arabext")} از ۵`);
      }
      if (freshness === "today") reasons.push("قیمت امروز است");
      if (quote.warranty) reasons.push("اطلاعات گارانتی ثبت شده");
      if (!eligible) reasons.push("یکی از شرط‌های سخت تو را رد می‌کند");

      return {
        quoteId: quote.id,
        score: Math.round(score),
        eligible,
        reasons: reasons.slice(0, 3),
      } satisfies DecisionResult;
    })
    .sort((a, b) => {
      if (a.eligible !== b.eligible) return a.eligible ? -1 : 1;
      return b.score - a.score;
    });
}
