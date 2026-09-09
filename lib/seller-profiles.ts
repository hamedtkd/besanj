import { normalizeIranPhone } from "./iranian-mobile.ts";
import { normalizePersianDigits } from "./normalize-persian-digits.ts";
import { quoteTotal } from "./quote.ts";
import type {
  Provider,
  PurchaseCase,
  Quote,
  SellerProfile,
} from "./types.ts";
import { normalizeOptionalText } from "./validation-rules.ts";

export interface SellerProfileInput {
  name: string;
  phone?: string | null;
  otherPhones?: string[];
  website?: string;
  instagram?: string;
  telegram?: string;
  whatsapp?: string;
  note?: string;
  favorite?: boolean;
  avoid?: boolean;
}

export interface SellerGraphResult {
  sellerProfiles: SellerProfile[];
  providers: Provider[];
}

export interface SellerQuoteHistoryRow {
  quote: Quote;
  purchaseCase?: PurchaseCase;
  provider: Provider;
  selected: boolean;
  purchased: boolean;
}

export interface SellerPurchaseHistoryRow {
  purchaseCase: PurchaseCase;
  quote: Quote;
  provider: Provider;
  actualPaidToman: number;
  purchasedAt: string;
  deliveredOnTime: boolean | null;
}

export interface SellerRatingHistoryRow {
  provider: Provider;
  purchaseCase?: PurchaseCase;
}

export interface SellerProfileStats {
  caseCount: number;
  quoteCount: number;
  purchaseCount: number;
  totalSpentToman: number;
  averageQuoteToman: number | null;
  averagePurchaseToman: number | null;
  averageRating: number | null;
  winRate: number;
  deliveryMeasuredCount: number;
  onTimeDeliveryCount: number;
  onTimeDeliveryRate: number | null;
  lastSeenAt: string;
}

export interface SellerProfileDetails {
  profile: SellerProfile;
  stats: SellerProfileStats;
  quotes: SellerQuoteHistoryRow[];
  purchases: SellerPurchaseHistoryRow[];
  ratings: SellerRatingHistoryRow[];
  caseIds: string[];
}

export interface SellerDirectoryRow {
  profile: SellerProfile;
  stats: SellerProfileStats;
}

function comparableName(value?: string) {
  return normalizePersianDigits(value ?? "")
    .trim()
    .toLocaleLowerCase("fa-IR")
    .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/\s+/g, " ");
}

export function normalizeSellerPhone(value?: string | null) {
  const normalized = normalizeIranPhone(value);
  return normalized || undefined;
}

function normalizeOtherPhones(values?: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values ?? []) {
    const normalized = normalizeSellerPhone(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }
  return result.slice(0, 8);
}

function normalizeHandle(value?: string) {
  const text = normalizeOptionalText(value);
  if (!text) return undefined;
  return text.replace(/^@+/, "").trim() || undefined;
}

function normalizeWebsite(value?: string) {
  return normalizeOptionalText(value);
}

export function normalizeSellerProfileInput(
  input: SellerProfileInput,
  now = new Date().toISOString()
): Omit<SellerProfile, "id" | "createdAt"> {
  const phone = normalizeSellerPhone(input.phone);
  const otherPhones = normalizeOtherPhones(input.otherPhones).filter(
    (item) => item !== phone
  );
  const favorite = Boolean(input.favorite);
  const avoid = Boolean(input.avoid);

  return {
    name: normalizeOptionalText(input.name) ?? "فروشنده بدون نام",
    phone,
    otherPhones: otherPhones.length ? otherPhones : undefined,
    website: normalizeWebsite(input.website),
    instagram: normalizeHandle(input.instagram),
    telegram: normalizeHandle(input.telegram),
    whatsapp: normalizeHandle(input.whatsapp),
    note: normalizeOptionalText(input.note),
    favorite: avoid ? false : favorite,
    avoid,
    updatedAt: now,
  };
}

export function sellerProfileIdentityKey(
  profile: Pick<SellerProfile, "name" | "phone">
) {
  const phone = normalizeSellerPhone(profile.phone);
  if (phone) return `phone:${phone}`;
  return `name:${comparableName(profile.name)}`;
}

export function providerSellerIdentityKey(
  provider: Pick<Provider, "sellerProfileId" | "name" | "phone">
) {
  if (provider.sellerProfileId) return `profile:${provider.sellerProfileId}`;
  const phone = normalizeSellerPhone(provider.phone);
  if (phone) return `phone:${phone}`;
  return `name:${comparableName(provider.name)}`;
}

function profileMatchesProvider(profile: SellerProfile, provider: Provider) {
  const phone = normalizeSellerPhone(provider.phone);
  if (phone) {
    if (normalizeSellerPhone(profile.phone) === phone) return true;
    return (profile.otherPhones ?? []).some(
      (candidate) => normalizeSellerPhone(candidate) === phone
    );
  }
  return !profile.phone && comparableName(profile.name) === comparableName(provider.name);
}

export function buildSellerGraph(
  providers: Provider[],
  existingProfiles: SellerProfile[] = [],
  options: {
    makeId?: () => string;
    now?: string;
  } = {}
): SellerGraphResult {
  const makeId = options.makeId ?? (() => crypto.randomUUID());
  const now = options.now ?? new Date().toISOString();
  const profiles = existingProfiles.map((profile) => ({ ...profile }));
  const profileById = new Map(profiles.map((profile) => [profile.id, profile]));
  const nextProviders: Provider[] = [];

  const findMatchingProfile = (provider: Provider) => {
    if (provider.sellerProfileId) {
      const linked = profileById.get(provider.sellerProfileId);
      if (linked) return linked;
    }
    return profiles.find((profile) => profileMatchesProvider(profile, provider));
  };

  for (const provider of providers) {
    let profile = findMatchingProfile(provider);
    if (!profile) {
      const normalized = normalizeSellerProfileInput(
        {
          name: provider.name,
          phone: provider.phone,
        },
        provider.updatedAt || now
      );
      profile = {
        id: makeId(),
        ...normalized,
        createdAt: provider.createdAt || now,
      };
      profiles.push(profile);
      profileById.set(profile.id, profile);
    }

    nextProviders.push({
      ...provider,
      sellerProfileId: profile.id,
      name: profile.name,
      phone: profile.phone,
    });
  }

  return { sellerProfiles: profiles, providers: nextProviders };
}

export function mergeSellerProfileRecords(
  target: SellerProfile,
  source: SellerProfile,
  now = new Date().toISOString()
): SellerProfile {
  const targetPhone = normalizeSellerPhone(target.phone);
  const sourcePhone = normalizeSellerPhone(source.phone);
  const primaryPhone = targetPhone ?? sourcePhone;
  const mergedPhones = normalizeOtherPhones([
    ...(target.otherPhones ?? []),
    ...(source.otherPhones ?? []),
    ...(sourcePhone && sourcePhone !== primaryPhone ? [sourcePhone] : []),
  ]).filter((value) => value !== primaryPhone);
  const avoid = Boolean(target.avoid || source.avoid);

  return {
    ...target,
    phone: primaryPhone,
    otherPhones: mergedPhones.length ? mergedPhones : undefined,
    website: target.website ?? source.website,
    instagram: target.instagram ?? source.instagram,
    telegram: target.telegram ?? source.telegram,
    whatsapp: target.whatsapp ?? source.whatsapp,
    note: [normalizeOptionalText(target.note), normalizeOptionalText(source.note)]
      .filter((value, index, rows) => value && rows.indexOf(value) === index)
      .join("\n\n") || undefined,
    favorite: avoid ? false : Boolean(target.favorite || source.favorite),
    avoid,
    createdAt:
      target.createdAt && source.createdAt
        ? [target.createdAt, source.createdAt].sort()[0]
        : target.createdAt || source.createdAt,
    updatedAt: now,
  };
}

function calendarDay(value?: string | null) {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return null;
  return Number(`${match[1]}${match[2]}${match[3]}`);
}

function deliveryStatus(purchaseCase: PurchaseCase) {
  const outcome = purchaseCase.purchaseOutcome;
  if (
    !outcome ||
    outcome.status !== "received" ||
    !outcome.expectedDeliveryAt ||
    !outcome.receivedAt
  ) {
    return null;
  }
  const expected = calendarDay(outcome.expectedDeliveryAt);
  const received = calendarDay(outcome.receivedAt);
  if (expected === null || received === null) return null;
  return received <= expected;
}

export function buildSellerProfileDetails(
  profile: SellerProfile,
  providers: Provider[],
  cases: PurchaseCase[],
  quotes: Quote[]
): SellerProfileDetails {
  const linkedProviders = providers.filter(
    (provider) => provider.sellerProfileId === profile.id
  );
  const providerById = new Map(linkedProviders.map((provider) => [provider.id, provider]));
  const caseById = new Map(cases.map((purchaseCase) => [purchaseCase.id, purchaseCase]));
  const linkedQuotes = quotes.filter((quote) => providerById.has(quote.providerId));
  const quoteById = new Map(linkedQuotes.map((quote) => [quote.id, quote]));
  const caseIds = Array.from(new Set(linkedProviders.map((provider) => provider.caseId)));

  const quoteRows: SellerQuoteHistoryRow[] = [];
  for (const quote of linkedQuotes) {
    const provider = providerById.get(quote.providerId);
    if (!provider) continue;
    const purchaseCase = caseById.get(quote.caseId);
    const outcome = purchaseCase?.purchaseOutcome;
    quoteRows.push({
      quote,
      provider,
      ...(purchaseCase ? { purchaseCase } : {}),
      selected: purchaseCase?.selectedQuoteId === quote.id,
      purchased: outcome?.quoteId === quote.id,
    });
  }
  quoteRows.sort((left, right) =>
    right.quote.quotedAt.localeCompare(left.quote.quotedAt)
  );

  const purchases: SellerPurchaseHistoryRow[] = [];
  for (const purchaseCase of cases) {
    const outcome = purchaseCase.purchaseOutcome;
    if (!outcome) continue;
    const quote = quoteById.get(outcome.quoteId);
    if (!quote) continue;
    const provider = providerById.get(quote.providerId);
    if (!provider) continue;
    purchases.push({
      purchaseCase,
      quote,
      provider,
      actualPaidToman: outcome.actualPaidToman,
      purchasedAt: outcome.purchasedAt,
      deliveredOnTime: deliveryStatus(purchaseCase),
    });
  }
  purchases.sort((left, right) => right.purchasedAt.localeCompare(left.purchasedAt));

  const ratings = linkedProviders
    .filter((provider) => provider.rating !== undefined)
    .map((provider) => ({ provider, purchaseCase: caseById.get(provider.caseId) }))
    .sort((left, right) =>
      (right.provider.ratingUpdatedAt ?? right.provider.updatedAt).localeCompare(
        left.provider.ratingUpdatedAt ?? left.provider.updatedAt
      )
    );

  const ratingValues = ratings
    .map((row) => row.provider.rating)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  const quoteTotals = linkedQuotes.map((quote) => quoteTotal(quote));
  const deliveryMeasuredCount = purchases.filter(
    (purchase) => purchase.deliveredOnTime !== null
  ).length;
  const onTimeDeliveryCount = purchases.filter(
    (purchase) => purchase.deliveredOnTime === true
  ).length;
  const lastSeenAt = [
    profile.updatedAt,
    ...linkedProviders.map((provider) => provider.updatedAt),
    ...linkedQuotes.map((quote) => quote.updatedAt),
  ]
    .filter(Boolean)
    .sort()
    .at(-1) ?? profile.updatedAt;

  return {
    profile,
    stats: {
      caseCount: caseIds.length,
      quoteCount: linkedQuotes.length,
      purchaseCount: purchases.length,
      totalSpentToman: purchases.reduce(
        (sum, purchase) => sum + purchase.actualPaidToman,
        0
      ),
      averageQuoteToman: quoteTotals.length
        ? quoteTotals.reduce((sum, total) => sum + total, 0) / quoteTotals.length
        : null,
      averagePurchaseToman: purchases.length
        ? purchases.reduce((sum, purchase) => sum + purchase.actualPaidToman, 0) /
          purchases.length
        : null,
      averageRating: ratingValues.length
        ? ratingValues.reduce((sum, rating) => sum + rating, 0) / ratingValues.length
        : null,
      winRate: caseIds.length ? purchases.length / caseIds.length : 0,
      deliveryMeasuredCount,
      onTimeDeliveryCount,
      onTimeDeliveryRate: deliveryMeasuredCount
        ? onTimeDeliveryCount / deliveryMeasuredCount
        : null,
      lastSeenAt,
    },
    quotes: quoteRows,
    purchases,
    ratings,
    caseIds,
  };
}

export function buildSellerDirectory(
  profiles: SellerProfile[],
  providers: Provider[],
  cases: PurchaseCase[],
  quotes: Quote[]
): SellerDirectoryRow[] {
  return profiles
    .map((profile) => ({
      profile,
      stats: buildSellerProfileDetails(profile, providers, cases, quotes).stats,
    }))
    .sort((left, right) => {
      if (Boolean(right.profile.favorite) !== Boolean(left.profile.favorite)) {
        return Number(Boolean(right.profile.favorite)) - Number(Boolean(left.profile.favorite));
      }
      if (Boolean(left.profile.avoid) !== Boolean(right.profile.avoid)) {
        return Number(Boolean(left.profile.avoid)) - Number(Boolean(right.profile.avoid));
      }
      if (right.stats.purchaseCount !== left.stats.purchaseCount) {
        return right.stats.purchaseCount - left.stats.purchaseCount;
      }
      return right.stats.lastSeenAt.localeCompare(left.stats.lastSeenAt);
    });
}

export function sellerMatchesSearch(profile: SellerProfile, search: string) {
  const query = comparableName(search);
  if (!query) return true;
  const haystack = [
    profile.name,
    profile.phone,
    ...(profile.otherPhones ?? []),
    profile.website,
    profile.instagram,
    profile.telegram,
    profile.whatsapp,
    profile.note,
  ]
    .filter(Boolean)
    .map((value) => comparableName(String(value)))
    .join(" ");
  return haystack.includes(query);
}

export function suggestedDuplicateSellerIds(
  profile: SellerProfile,
  profiles: SellerProfile[]
) {
  const name = comparableName(profile.name);
  const phones = new Set(
    [profile.phone, ...(profile.otherPhones ?? [])]
      .map((value) => normalizeSellerPhone(value))
      .filter((value): value is string => Boolean(value))
  );

  return profiles
    .filter((candidate) => candidate.id !== profile.id)
    .filter((candidate) => {
      const candidatePhones = [candidate.phone, ...(candidate.otherPhones ?? [])]
        .map((value) => normalizeSellerPhone(value))
        .filter((value): value is string => Boolean(value));
      return (
        (name && comparableName(candidate.name) === name) ||
        candidatePhones.some((phone) => phones.has(phone))
      );
    })
    .map((candidate) => candidate.id);
}

export function sellerExternalLinks(profile: SellerProfile) {
  const website = normalizeOptionalText(profile.website);
  const instagram = normalizeHandle(profile.instagram);
  const telegram = normalizeHandle(profile.telegram);
  const whatsapp = normalizeHandle(profile.whatsapp);
  const phone = normalizeSellerPhone(profile.phone);

  const normalizeWebHref = (value?: string) => {
    if (!value) return undefined;
    if (/^https?:\/\//i.test(value)) return value;
    return `https://${value}`;
  };

  return {
    website: normalizeWebHref(website),
    instagram: instagram
      ? /^https?:\/\//i.test(instagram)
        ? instagram
        : `https://instagram.com/${instagram}`
      : undefined,
    telegram: telegram
      ? /^https?:\/\//i.test(telegram)
        ? telegram
        : `https://t.me/${telegram}`
      : undefined,
    whatsapp: whatsapp
      ? /^https?:\/\//i.test(whatsapp)
        ? whatsapp
        : /^\d+$/.test(whatsapp)
          ? `https://wa.me/${whatsapp.replace(/^0/, "98")}`
          : `https://wa.me/${whatsapp}`
      : phone && /^09\d{9}$/.test(phone)
        ? `https://wa.me/98${phone.slice(1)}`
        : undefined,
  };
}

export function pickLatestRatedProvider(providers: Provider[]) {
  return [...providers]
    .filter(
      (provider) => provider.rating !== undefined && Number.isFinite(provider.rating)
    )
    .sort((left, right) =>
      (right.ratingUpdatedAt ?? right.updatedAt).localeCompare(
        left.ratingUpdatedAt ?? left.updatedAt
      )
    )[0];
}
