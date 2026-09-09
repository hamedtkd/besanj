import assert from "node:assert/strict";
import test from "node:test";
import {
  buildBesanjBackupFile,
  decodeBackupAttachments,
  makeBackupFileName,
  parseBesanjBackupText,
} from "../lib/backup-format.ts";

test("full backup round-trips attachment bytes and metadata", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [
        {
          id: "case-1",
          title: "لپ‌تاپ",
          kind: "product",
          status: "active",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      providers: [
        {
          id: "provider-1",
          caseId: "case-1",
          name: "فروشنده",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      quotes: [
        {
          id: "quote-1",
          caseId: "case-1",
          providerId: "provider-1",
          priceToman: 100,
          quotedAt: "2026-09-08T00:00:00.000Z",
          channel: "phone",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      reminders: [],
      attachments: [
        {
          id: "att-1",
          caseId: "case-1",
          quoteId: "quote-1",
          fileName: "note.txt",
          mimeType: "text/plain",
          size: 5,
          blob: new Blob(["hello"], { type: "text/plain" }),
          createdAt: "2026-09-08T00:00:00.000Z",
        },
      ],
    },
    {
      appVersion: "0.6.0",
      exportedAt: "2026-09-08T10:00:00.000Z",
      preferences: { theme: "dark", palette: "blue" },
    }
  );

  const parsed = parseBesanjBackupText(JSON.stringify(backup));
  const decoded = decodeBackupAttachments(parsed.data.attachments);

  assert.equal(parsed.stats.cases, 1);
  assert.equal(parsed.stats.attachments, 1);
  assert.equal(parsed.preferences?.theme, "dark");
  assert.equal(await decoded[0]?.blob.text(), "hello");
  assert.equal(decoded[0]?.mimeType, "text/plain");
});

test("backup parser rejects files from another format", () => {
  assert.throws(
    () =>
      parseBesanjBackupText(
        JSON.stringify({ format: "other-app", version: 1, data: {} })
      ),
    /پشتیبان معتبر بسنج/
  );
});

test("attachment integrity rejects tampered declared size", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [],
      providers: [],
      quotes: [],
      reminders: [],
      attachments: [
        {
          id: "att-1",
          caseId: "case-1",
          quoteId: "quote-1",
          fileName: "a.txt",
          mimeType: "text/plain",
          size: 1,
          blob: new Blob(["abc"]),
          createdAt: "2026-09-08T00:00:00.000Z",
        },
      ],
    },
    { appVersion: "0.6.0" }
  );

  backup.data.attachments[0]!.size = 99;
  assert.throws(
    () => decodeBackupAttachments(backup.data.attachments),
    /هم‌خوان نیست/
  );
});

test("backup filename uses export calendar date", () => {
  assert.equal(
    makeBackupFileName("2026-09-08T21:00:00.000Z"),
    "besanj-backup-20260908.json"
  );
});

test("backup validates purchase outcome against the selected quote", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [
        {
          id: "case-1",
          title: "لپ‌تاپ",
          kind: "product",
          status: "decided",
          selectedQuoteId: "quote-1",
          purchaseOutcome: {
            quoteId: "quote-1",
            status: "ordered",
            purchasedAt: "2026-09-08T23:59:59.999Z",
            actualPaidToman: 100,
            updatedAt: "2026-09-08T12:00:00.000Z",
          },
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T12:00:00.000Z",
        },
      ],
      providers: [
        {
          id: "provider-1",
          caseId: "case-1",
          name: "فروشنده",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      quotes: [
        {
          id: "quote-1",
          caseId: "case-1",
          providerId: "provider-1",
          priceToman: 100,
          quotedAt: "2026-09-08T00:00:00.000Z",
          channel: "phone",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      reminders: [],
      attachments: [],
    },
    { appVersion: "1.0.0" }
  );

  parseBesanjBackupText(JSON.stringify(backup));
  backup.data.purchaseCases[0]!.purchaseOutcome!.quoteId = "quote-other";
  assert.throws(
    () => parseBesanjBackupText(JSON.stringify(backup)),
    /همان استعلام انتخاب نهایی/
  );
});

test("backup preserves category tags and monthly budget settings", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [
        {
          id: "case-budget",
          title: "موبایل",
          kind: "product",
          status: "active",
          categoryKey: "digital",
          categoryLabel: "دیجیتال",
          tags: ["ضروری", "شخصی"],
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      providers: [],
      quotes: [],
      reminders: [],
      attachments: [],
      budgetPlans: [
        {
          id: "monthly",
          monthlyLimitToman: 100_000_000,
          categoryLimits: { digital: 70_000_000 },
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
    },
    { appVersion: "1.2.0" }
  );

  const parsed = parseBesanjBackupText(JSON.stringify(backup));
  assert.equal(parsed.data.purchaseCases[0]?.categoryKey, "digital");
  assert.deepEqual(parsed.data.purchaseCases[0]?.tags, ["ضروری", "شخصی"]);
  assert.equal(parsed.data.budgetPlans?.[0]?.monthlyLimitToman, 100_000_000);
  assert.equal(parsed.stats.budgetPlans, 1);
});

test("backup parser accepts older files without budget settings", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [],
      providers: [],
      quotes: [],
      reminders: [],
      attachments: [],
    },
    { appVersion: "1.1.0" }
  );
  const oldShape = JSON.parse(JSON.stringify(backup));
  delete oldShape.data.budgetPlans;
  delete oldShape.stats.budgetPlans;
  const parsed = parseBesanjBackupText(JSON.stringify(oldShape));
  assert.deepEqual(parsed.data.budgetPlans, []);
});

test("backup preserves global seller profiles and provider links", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [
        {
          id: "case-seller",
          title: "مانیتور",
          kind: "product",
          status: "active",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      sellerProfiles: [
        {
          id: "seller-1",
          name: "فروشگاه آریا",
          phone: "09121111111",
          otherPhones: ["02188776655"],
          instagram: "aria_shop",
          favorite: true,
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      providers: [
        {
          id: "provider-seller",
          caseId: "case-seller",
          sellerProfileId: "seller-1",
          name: "فروشگاه آریا",
          phone: "09121111111",
          rating: 5,
          ratingUpdatedAt: "2026-09-08T00:00:00.000Z",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      quotes: [],
      reminders: [],
      attachments: [],
    },
    { appVersion: "1.3.0" }
  );

  const parsed = parseBesanjBackupText(JSON.stringify(backup));
  assert.equal(parsed.stats.sellerProfiles, 1);
  assert.equal(parsed.data.sellerProfiles?.[0]?.instagram, "aria_shop");
  assert.equal(parsed.data.providers[0]?.sellerProfileId, "seller-1");
});

test("backup parser accepts v1.2 files without seller profiles", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [
        {
          id: "case-old-seller",
          title: "خرید قدیمی",
          kind: "product",
          status: "active",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      providers: [
        {
          id: "provider-old",
          caseId: "case-old-seller",
          name: "فروشنده قدیمی",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      quotes: [],
      reminders: [],
      attachments: [],
    },
    { appVersion: "1.2.0" }
  );
  const oldShape = JSON.parse(JSON.stringify(backup));
  delete oldShape.data.sellerProfiles;
  delete oldShape.stats.sellerProfiles;

  const parsed = parseBesanjBackupText(JSON.stringify(oldShape));
  assert.deepEqual(parsed.data.sellerProfiles, []);
  assert.equal(parsed.data.providers[0]?.sellerProfileId, undefined);
});

test("backup rejects a dangling seller profile link", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [
        {
          id: "case-broken-seller",
          title: "خرید",
          kind: "product",
          status: "active",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      sellerProfiles: [],
      providers: [
        {
          id: "provider-broken",
          caseId: "case-broken-seller",
          sellerProfileId: "missing",
          name: "فروشنده",
          createdAt: "2026-09-08T00:00:00.000Z",
          updatedAt: "2026-09-08T00:00:00.000Z",
        },
      ],
      quotes: [],
      reminders: [],
      attachments: [],
    },
    { appVersion: "1.3.0" }
  );

  assert.throws(
    () => parseBesanjBackupText(JSON.stringify(backup)),
    /پروفایل سراسری/
  );
});

test("backup preserves personal case templates", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [],
      providers: [],
      quotes: [],
      reminders: [],
      attachments: [],
      caseTemplates: [
        {
          id: "template-1",
          name: "خرید کاری",
          kind: "product",
          categoryKey: "digital",
          categoryLabel: "دیجیتال",
          tags: ["کاری"],
          requirementLabels: ["گارانتی", "تحویل"],
          favorite: true,
          useCount: 2,
          createdAt: "2026-09-09T00:00:00.000Z",
          updatedAt: "2026-09-09T00:00:00.000Z",
        },
      ],
    },
    { appVersion: "1.6.0" }
  );

  const parsed = parseBesanjBackupText(JSON.stringify(backup));
  assert.equal(parsed.stats.caseTemplates, 1);
  assert.equal(parsed.data.caseTemplates?.[0]?.name, "خرید کاری");
  assert.deepEqual(parsed.data.caseTemplates?.[0]?.requirementLabels, ["گارانتی", "تحویل"]);
});

test("backup parser accepts older files without case templates", async () => {
  const backup = await buildBesanjBackupFile(
    {
      purchaseCases: [],
      providers: [],
      quotes: [],
      reminders: [],
      attachments: [],
    },
    { appVersion: "1.5.1" }
  );
  const oldShape = JSON.parse(JSON.stringify(backup));
  delete oldShape.data.caseTemplates;
  delete oldShape.stats.caseTemplates;
  const parsed = parseBesanjBackupText(JSON.stringify(oldShape));
  assert.deepEqual(parsed.data.caseTemplates, []);
});
