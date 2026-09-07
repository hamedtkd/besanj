import test from "node:test";
import assert from "node:assert/strict";
import { cleanDisplayText, formatPhone, formatToman, formatUserText } from "../lib/format.ts";
import { toPersianDigits } from "../lib/persian-date.ts";

test("visible numeric text is Persian", () => {
  assert.equal(toPersianDigits("0912-18"), "۰۹۱۲-۱۸");
  assert.equal(formatPhone("09121234567"), "۰۹۱۲۱۲۳۴۵۶۷");
  assert.match(formatToman(1234567), /۱.*۲.*۳.*۴.*۵.*۶.*۷/);
  assert.equal(cleanDisplayText("shop-123"), "shop-۱۲۳");
});

test("optional user text never exposes legacy null sentinel", () => {
  assert.equal(formatUserText("null"), "ثبت نشده");
  assert.equal(formatUserText(" 18 ماه "), "۱۸ ماه");
});
