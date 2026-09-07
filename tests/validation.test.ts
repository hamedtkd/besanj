import test from "node:test";
import assert from "node:assert/strict";
import { isValidQuoteDateRange, normalizeOptionalText } from "../lib/validation-rules.ts";

test("validUntil may equal quotedAt", () => {
  assert.equal(
    isValidQuoteDateRange("2026-09-06", "2026-09-06"),
    true
  );
});

test("validUntil may be after quotedAt", () => {
  assert.equal(
    isValidQuoteDateRange("2026-09-06", "2026-09-08"),
    true
  );
});

test("validUntil cannot be before quotedAt", () => {
  assert.equal(
    isValidQuoteDateRange("2026-09-06", "2026-09-05"),
    false
  );
});

test("empty validUntil is allowed", () => {
  assert.equal(isValidQuoteDateRange("2026-09-06", ""), true);
});


test("optional text removes legacy null-like sentinels", () => {
  assert.equal(normalizeOptionalText("null"), undefined);
  assert.equal(normalizeOptionalText(" NULL "), undefined);
  assert.equal(normalizeOptionalText("undefined"), undefined);
  assert.equal(normalizeOptionalText("NaN"), undefined);
  assert.equal(normalizeOptionalText(" ۱۸ ماه "), "۱۸ ماه");
});
