export const MAX_COMPARE_QUOTES = 4;

export function toggleShortlist(ids: string[], quoteId: string) {
  if (ids.includes(quoteId)) {
    return { ids: ids.filter((id) => id !== quoteId), limitReached: false };
  }
  if (ids.length >= MAX_COMPARE_QUOTES) {
    return { ids, limitReached: true };
  }
  return { ids: [...ids, quoteId], limitReached: false };
}
