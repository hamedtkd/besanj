import type { Provider } from "./types.ts";
import { normalizePersianDigits } from "./normalize-persian-digits.ts";

export interface ProviderSuggestion {
  value: string;
  provider: Provider;
  scope: "current" | "history";
}

function normalizedName(value: string) {
  return normalizePersianDigits(value)
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
    .replace(/\s+/g, " ");
}

function normalizedPhone(value?: string) {
  return normalizePersianDigits(value ?? "").replace(/\D/g, "");
}

function providerKey(provider: Provider) {
  return `${normalizedName(provider.name)}|${normalizedPhone(provider.phone)}`;
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
    const key = providerKey(provider);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ value: `current:${provider.id}`, provider, scope: "current" });
  }

  for (const provider of history) {
    const key = providerKey(provider);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ value: `history:${provider.id}`, provider, scope: "history" });
    if (result.length >= limit) break;
  }

  return result.slice(0, limit);
}
