import { providerSellerIdentityKey } from "./seller-profiles.ts";
import type { Provider } from "./types.ts";

export interface ProviderSuggestion {
  value: string;
  provider: Provider;
  scope: "current" | "history";
}

function byLatest(a: Provider, b: Provider) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

export function buildProviderSuggestions(
  currentCaseId: string,
  providers: Provider[],
  limit = 16
): ProviderSuggestion[] {
  const current = providers
    .filter((provider) => provider.caseId === currentCaseId)
    .sort(byLatest);
  const history = providers
    .filter((provider) => provider.caseId !== currentCaseId)
    .sort(byLatest);

  const seen = new Set<string>();
  const result: ProviderSuggestion[] = [];

  for (const provider of current) {
    const key = providerSellerIdentityKey(provider);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ value: `current:${provider.id}`, provider, scope: "current" });
  }

  for (const provider of history) {
    const key = providerSellerIdentityKey(provider);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ value: `history:${provider.id}`, provider, scope: "history" });
    if (result.length >= limit) break;
  }

  return result.slice(0, limit);
}
