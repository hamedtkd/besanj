import test from "node:test";
import assert from "node:assert/strict";
import {
  formatPersianDecimal,
  formatPersianInteger,
  formatPersianPercent,
  toPersianDigits,
} from "../lib/persian-number.ts";
import {
  formatCompactPersianDate,
  formatPersianDate,
  formatPersianDateTime,
  formatPhone,
  formatToman,
} from "../lib/format.ts";

const NON_PERSIAN_DIGIT = /[0-9٠-٩]/;

test("digit normalization converts Latin and Arabic-Indic digits to Persian", () => {
  assert.equal(
    toPersianDigits("0123456789 ٠١٢٣٤٥٦٧٨٩"),
    "۰۱۲۳۴۵۶۷۸۹ ۰۱۲۳۴۵۶۷۸۹"
  );
});

test("central Persian number formatters force arabext digits", () => {
  assert.equal(formatPersianInteger(1234567), "۱٬۲۳۴٬۵۶۷");
  assert.equal(formatPersianDecimal(12.5), "۱۲٫۵");
  assert.equal(formatPersianPercent(37.5), "۳۷٫۵٪");
});

test("money and phone display never expose Latin or Arabic-Indic digits", () => {
  assert.equal(formatToman(9876543), "۹٬۸۷۶٬۵۴۳");
  assert.equal(formatPhone("٠٩١٢1234567"), "۰۹۱۲۱۲۳۴۵۶۷");
});

test("Persian calendar formatters force Persian digits", () => {
  const date = new Date("2026-09-09T12:00:00.000Z");
  for (const value of [
    formatPersianDate(date),
    formatCompactPersianDate(date),
    formatPersianDateTime(date),
  ]) {
    assert.equal(NON_PERSIAN_DIGIT.test(value), false, value);
  }
});

test("mixed display text keeps letters but converts embedded digits", () => {
  assert.equal(toPersianDigits("فاکتور A-2048"), "فاکتور A-۲۰۴۸");
});
