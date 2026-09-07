import { getQuoteFreshness, quoteTotal } from "./quote.ts";
import type { Provider, Quote, QuoteFilterState } from "./types.ts";

export const EMPTY_QUOTE_FILTERS: QuoteFilterState = {
  search: "",
  providerId: "all",
  channel: "all",
  freshness: "all",
  warranty: "all",
  maxDeliveryDays: null,
  minPriceToman: null,
  maxPriceToman: null,
  quotedFrom: null,
  quotedTo: null,
  sort: "priceAsc",
};

function normalized(value: string) {
  return value.trim().toLocaleLowerCase("fa-IR");
}

function atStartOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy.getTime();
}

function atEndOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy.getTime();
}

export function filterQuotes(
  quotes: Quote[],
  providers: Provider[],
  filters: QuoteFilterState,
  now = new Date()
) {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const query = normalized(filters.search);

  const rows = quotes.filter((quote) => {
    const provider = providerById.get(quote.providerId);
    if (!provider) return false;
    const total = quoteTotal(quote);

    if (filters.providerId !== "all" && quote.providerId !== filters.providerId) return false;

    if (query) {
      const haystack = normalized(
        [provider.name, provider.phone, quote.contactRef, quote.note, quote.warranty]
          .filter(Boolean)
          .join(" ")
      );
      if (!haystack.includes(query)) return false;
    }

    if (filters.channel !== "all" && quote.channel !== filters.channel) return false;
    if (
      filters.freshness !== "all" &&
      getQuoteFreshness(quote, now) !== filters.freshness
    ) {
      return false;
    }
    if (filters.warranty === "with" && !quote.warranty) return false;
    if (filters.warranty === "without" && quote.warranty) return false;
    if (
      filters.maxDeliveryDays !== null &&
      (quote.deliveryDays === undefined || quote.deliveryDays > filters.maxDeliveryDays)
    ) {
      return false;
    }
    if (filters.minPriceToman !== null && total < filters.minPriceToman) return false;
    if (filters.maxPriceToman !== null && total > filters.maxPriceToman) return false;

    const quotedAt = new Date(quote.quotedAt).getTime();
    if (filters.quotedFrom && quotedAt < atStartOfDay(filters.quotedFrom)) return false;
    if (filters.quotedTo && quotedAt > atEndOfDay(filters.quotedTo)) return false;

    return true;
  });

  return rows.sort((a, b) => {
    if (filters.sort === "priceDesc") return quoteTotal(b) - quoteTotal(a);
    if (filters.sort === "newest") {
      return new Date(b.quotedAt).getTime() - new Date(a.quotedAt).getTime();
    }
    if (filters.sort === "delivery") {
      return (a.deliveryDays ?? Number.POSITIVE_INFINITY) -
        (b.deliveryDays ?? Number.POSITIVE_INFINITY);
    }
    return quoteTotal(a) - quoteTotal(b);
  });
}

export function activeFilterCount(filters: QuoteFilterState) {
  let count = 0;
  if (filters.search.trim()) count++;
  if (filters.providerId !== "all") count++;
  if (filters.channel !== "all") count++;
  if (filters.freshness !== "all") count++;
  if (filters.warranty !== "all") count++;
  if (filters.maxDeliveryDays !== null) count++;
  if (filters.minPriceToman !== null) count++;
  if (filters.maxPriceToman !== null) count++;
  if (filters.quotedFrom) count++;
  if (filters.quotedTo) count++;
  if (filters.sort !== "priceAsc") count++;
  return count;
}
