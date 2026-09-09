import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSellerDirectory,
  buildSellerGraph,
  buildSellerProfileDetails,
  mergeSellerProfileRecords,
  providerSellerIdentityKey,
  suggestedDuplicateSellerIds,
} from "../lib/seller-profiles.ts";
import type { Provider, PurchaseCase, Quote, SellerProfile } from "../lib/types.ts";

const now = "2026-09-08T12:00:00.000Z";

function provider(overrides: Partial<Provider> & Pick<Provider, "id" | "caseId" | "name">): Provider {
  return {
    phone: undefined,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function profile(overrides: Partial<SellerProfile> & Pick<SellerProfile, "id" | "name">): SellerProfile {
  return {
    createdAt: now,
    updatedAt: now,
    favorite: false,
    avoid: false,
    ...overrides,
  };
}

function purchaseCase(overrides: Partial<PurchaseCase> & Pick<PurchaseCase, "id" | "title">): PurchaseCase {
  return {
    kind: "product",
    status: "active",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function quote(overrides: Partial<Quote> & Pick<Quote, "id" | "caseId" | "providerId">): Quote {
  return {
    priceToman: 100_000,
    quotedAt: "2026-09-01T12:00:00.000Z",
    channel: "phone",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

test("seller graph merges repeated phone history and links providers", () => {
  let counter = 0;
  const graph = buildSellerGraph(
    [
      provider({ id: "p1", caseId: "c1", name: "فروشگاه آریا", phone: "0912 123 4567" }),
      provider({ id: "p2", caseId: "c2", name: "آریا", phone: "+98 912 123 4567" }),
      provider({ id: "p3", caseId: "c3", name: "بدون شماره" }),
      provider({ id: "p4", caseId: "c4", name: "بدون شماره" }),
    ],
    [],
    { makeId: () => `seller-${++counter}`, now }
  );

  assert.equal(graph.sellerProfiles.length, 2);
  assert.equal(graph.providers[0]?.sellerProfileId, graph.providers[1]?.sellerProfileId);
  assert.equal(graph.providers[2]?.sellerProfileId, graph.providers[3]?.sellerProfileId);
  assert.notEqual(graph.providers[0]?.sellerProfileId, graph.providers[2]?.sellerProfileId);
});

test("seller graph preserves existing profile ids and shared name", () => {
  const existing = profile({ id: "seller-1", name: "نام سراسری", phone: "09120000000" });
  const graph = buildSellerGraph(
    [provider({ id: "p1", caseId: "c1", name: "نام قدیمی", phone: "09120000000" })],
    [existing],
    { makeId: () => "unexpected", now }
  );

  assert.equal(graph.sellerProfiles.length, 1);
  assert.equal(graph.providers[0]?.sellerProfileId, "seller-1");
  assert.equal(graph.providers[0]?.name, "نام سراسری");
});

test("seller identity prefers stable profile id", () => {
  assert.equal(
    providerSellerIdentityKey({ sellerProfileId: "seller-1", name: "الف", phone: "09120000000" }),
    "profile:seller-1"
  );
});

test("merge keeps target identity and preserves source contacts", () => {
  const target = profile({
    id: "target",
    name: "فروشگاه اصلی",
    phone: "09121111111",
    favorite: true,
    note: "یادداشت اول",
  });
  const source = profile({
    id: "source",
    name: "نام قدیمی",
    phone: "09122222222",
    instagram: "aria_shop",
    avoid: true,
    note: "یادداشت دوم",
  });

  const merged = mergeSellerProfileRecords(target, source, now);
  assert.equal(merged.id, "target");
  assert.equal(merged.name, "فروشگاه اصلی");
  assert.equal(merged.phone, "09121111111");
  assert.deepEqual(merged.otherPhones, ["09122222222"]);
  assert.equal(merged.instagram, "aria_shop");
  assert.equal(merged.avoid, true);
  assert.equal(merged.favorite, false);
  assert.match(merged.note ?? "", /یادداشت اول/);
  assert.match(merged.note ?? "", /یادداشت دوم/);

  const adoptedPrimary = mergeSellerProfileRecords(
    profile({ id: "target-empty", name: "بدون شماره", phone: undefined }),
    profile({ id: "source-phone", name: "شماره‌دار", phone: "09123333333" }),
    now
  );
  assert.equal(adoptedPrimary.phone, "09123333333");
  assert.equal(adoptedPrimary.otherPhones, undefined);
});

test("seller details expose quotes purchases ratings and delivery history", () => {
  const seller = profile({ id: "seller-1", name: "آریا", phone: "09121111111" });
  const providers = [
    provider({
      id: "p1",
      caseId: "c1",
      sellerProfileId: seller.id,
      name: seller.name,
      phone: seller.phone,
      rating: 5,
      ratingNote: "خوش‌قول",
      ratingUpdatedAt: "2026-09-05T12:00:00.000Z",
    }),
    provider({
      id: "p2",
      caseId: "c2",
      sellerProfileId: seller.id,
      name: seller.name,
      phone: seller.phone,
      rating: 3,
      ratingUpdatedAt: "2026-09-06T12:00:00.000Z",
    }),
  ];
  const quotes = [
    quote({ id: "q1", caseId: "c1", providerId: "p1", priceToman: 110_000 }),
    quote({ id: "q2", caseId: "c2", providerId: "p2", priceToman: 90_000 }),
  ];
  const cases = [
    purchaseCase({
      id: "c1",
      title: "خرید اول",
      status: "decided",
      selectedQuoteId: "q1",
      purchaseOutcome: {
        quoteId: "q1",
        status: "received",
        purchasedAt: "2026-09-02",
        actualPaidToman: 105_000,
        expectedDeliveryAt: "2026-09-04",
        receivedAt: "2026-09-03",
        updatedAt: now,
      },
    }),
    purchaseCase({ id: "c2", title: "خرید دوم" }),
  ];

  const details = buildSellerProfileDetails(seller, providers, cases, quotes);
  assert.equal(details.stats.caseCount, 2);
  assert.equal(details.stats.quoteCount, 2);
  assert.equal(details.stats.purchaseCount, 1);
  assert.equal(details.stats.totalSpentToman, 105_000);
  assert.equal(details.stats.averageQuoteToman, 100_000);
  assert.equal(details.stats.averageRating, 4);
  assert.equal(details.stats.winRate, 0.5);
  assert.equal(details.stats.onTimeDeliveryRate, 1);
  assert.equal(details.ratings[0]?.provider.id, "p2");
  assert.equal(details.purchases[0]?.deliveredOnTime, true);
});

test("seller directory puts favorites first and avoided sellers last", () => {
  const profiles = [
    profile({ id: "normal", name: "معمولی" }),
    profile({ id: "avoid", name: "پیشنهاد نمی‌شود", avoid: true }),
    profile({ id: "favorite", name: "محبوب", favorite: true }),
  ];
  const rows = buildSellerDirectory(profiles, [], [], []);
  assert.equal(rows[0]?.profile.id, "favorite");
  assert.equal(rows.at(-1)?.profile.id, "avoid");
});

test("duplicate suggestions use shared name or phone", () => {
  const base = profile({ id: "a", name: "آریا", phone: "09121111111" });
  const rows = [
    base,
    profile({ id: "b", name: "آریا" }),
    profile({ id: "c", name: "دیگر", phone: "09121111111" }),
    profile({ id: "d", name: "نام متفاوت", phone: "09123333333" }),
  ];
  assert.deepEqual(suggestedDuplicateSellerIds(base, rows).sort(), ["b", "c"]);
});
