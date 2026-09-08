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
