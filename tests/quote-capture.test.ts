import test from "node:test";
import assert from "node:assert/strict";
import { parseQuoteCapture } from "../lib/quote-capture.ts";

test("quote capture parses Persian digits and common quote fields", () => {
  const draft = parseQuoteCapture(`
فروشگاه آریا
قیمت: ۶۸,۵۰۰,۰۰۰ تومان
موبایل: ۰۹۱۲۱۲۳۴۵۶۷
تحویل ۳ روز
گارانتی: ۱۸ ماه شرکتی
پرداخت: نقدی
اعتبار ۲ روز
واتساپ
  `);

  assert.equal(draft.providerName, "فروشگاه آریا");
  assert.equal(draft.priceToman, 68_500_000);
  assert.equal(draft.phone, "09121234567");
  assert.equal(draft.deliveryDays, 3);
  assert.equal(draft.warranty, "۱۸ ماه شرکتی");
  assert.equal(draft.paymentTerms, "نقدی");
  assert.equal(draft.validForDays, 2);
  assert.equal(draft.channel, "whatsapp");
});

test("quote capture converts rial to toman", () => {
  const draft = parseQuoteCapture("قیمت: 720,000,000 ریال");
  assert.equal(draft.priceToman, 72_000_000);
});

test("quote capture recognizes immediate delivery and tomorrow validity", () => {
  const draft = parseQuoteCapture("فروشگاه نمونه\nقیمت 10 میلیون تومان\nتحویل فوری\nاعتبار تا فردا");
  assert.equal(draft.priceToman, 10_000_000);
  assert.equal(draft.deliveryDays, 0);
  assert.equal(draft.validForDays, 1);
});

test("quote capture warns when price is missing", () => {
  const draft = parseQuoteCapture("فروشگاه نمونه\nتحویل 2 روز");
  assert.equal(draft.priceToman, undefined);
  assert.equal(draft.warnings.some((item) => item.includes("قیمت")), true);
});
