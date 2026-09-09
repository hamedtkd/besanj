import test from "node:test";
import assert from "node:assert/strict";
import { parseQuickCaptureDraft, parseQuickToman } from "../lib/quick-capture.ts";
import { parseQuoteCapture } from "../lib/quote-capture.ts";
import { parsePersianNumberWords, parseSpokenDigitSequence } from "../lib/spoken-persian-number.ts";

test("quick amount accepts compact million notation and Persian digits", () => {
  assert.equal(parseQuickToman("۶۸ میلیون").valueToman, 68_000_000);
  assert.equal(parseQuickToman("68م").valueToman, 68_000_000);
  assert.equal(parseQuickToman("68,000,000").valueToman, 68_000_000);
});

test("bare small quick amount is review-first million assumption", () => {
  const result = parseQuickToman("68");
  assert.equal(result.valueToman, 68_000_000);
  assert.equal(result.assumedMillions, true);
  assert.match(result.warning ?? "", /میلیون/);
});

test("Persian spoken number parser handles common price phrases", () => {
  assert.equal(parsePersianNumberWords("شصت و هشت"), 68);
  assert.equal(parsePersianNumberWords("دو و نیم میلیون"), 2_500_000);
  assert.equal(parsePersianNumberWords("هجده"), 18);
});

test("spoken individual phone digits are preserved in order", () => {
  assert.equal(
    parseSpokenDigitSequence("صفر نه یک دو یک دو سه چهار پنج شش هفت هشت نه"),
    "0912123456789"
  );
});

test("voice-style quote text extracts title price stock warranty delivery and phone", () => {
  const draft = parseQuoteCapture(
    "سامسونگ ۵۵ Q70 ۶۸ میلیون موجود گارانتی ۱۸ ماه ارسال فردا 09121234567"
  );
  assert.equal(draft.subjectTitle, "سامسونگ ۵۵ Q70");
  assert.equal(draft.priceToman, 68_000_000);
  assert.equal(draft.availability, "available");
  assert.equal(draft.warranty, "۱۸ ماه");
  assert.equal(draft.deliveryDays, 1);
  assert.equal(draft.phone, "09121234567");
});

test("quick capture draft expires and rejects malformed data", () => {
  const now = Date.UTC(2026, 8, 9);
  const fresh = JSON.stringify({ mode: "quote", text: "۶۸ میلیون", updatedAt: new Date(now - 1000).toISOString() });
  assert.equal(parseQuickCaptureDraft(fresh, now)?.mode, "quote");
  assert.equal(parseQuickCaptureDraft("{}", now), undefined);
  const stale = JSON.stringify({ mode: "case", text: "تلویزیون", updatedAt: new Date(now - 8 * 86_400_000).toISOString() });
  assert.equal(parseQuickCaptureDraft(stale, now), undefined);
});

test("voice text keeps product title separate from a spoken Persian price", () => {
  const draft = parseQuoteCapture(
    "سامسونگ ۵۵ Q70 شصت و هشت میلیون موجود گارانتی هجده ماه ارسال فردا صفر نه یک دو یک دو سه چهار پنج شش هفت"
  );
  assert.equal(draft.subjectTitle, "سامسونگ ۵۵ Q70");
  assert.equal(draft.priceToman, 68_000_000);
  assert.equal(draft.phone, "09121234567");
  assert.equal(draft.warranty, "هجده ماه");
});

test("seller-prefixed natural text stops seller name before quote details", () => {
  const draft = parseQuoteCapture("فروشگاه آریا شصت و هشت میلیون موجود تحویل فردا");
  assert.equal(draft.providerName, "فروشگاه آریا");
  assert.equal(draft.priceToman, 68_000_000);
  assert.equal(draft.availability, "available");
});
