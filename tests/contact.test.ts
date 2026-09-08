import assert from "node:assert/strict";
import test from "node:test";
import {
  buildFollowUpMessage,
  buildProviderContactLinks,
} from "../lib/contact.ts";

test("contact links normalize Persian mobile digits", () => {
  const links = buildProviderContactLinks("۰۹۱۲ ۱۲۳ ۴۵۶۷", "سلام");
  assert.equal(links.callHref, "tel:09121234567");
  assert.equal(links.whatsappHref?.startsWith("https://wa.me/989121234567"), true);
  assert.equal(links.smsHref?.startsWith("sms:09121234567?body="), true);
});

test("non-mobile phone supports call but not mobile messaging actions", () => {
  const links = buildProviderContactLinks("021-88776655", "پیگیری");
  assert.equal(links.callHref, "tel:02188776655");
  assert.equal(links.smsHref, undefined);
  assert.equal(links.whatsappHref, undefined);
});

test("follow-up message includes case, price and validity when available", () => {
  const text = buildFollowUpMessage({
    caseTitle: "لپ‌تاپ",
    providerName: "فروشگاه نمونه",
    quotedPriceToman: 75_000_000,
    validUntil: "2026-09-10T12:00:00.000Z",
  });
  assert.equal(text.includes("لپ‌تاپ"), true);
  assert.equal(text.includes("فروشگاه نمونه"), true);
  assert.equal(text.includes("۷۵٬۰۰۰٬۰۰۰"), true);
  assert.equal(text.includes("لطفاً اگر قیمت یا شرایط تغییر کرده"), true);
});
