import test from "node:test";
import assert from "node:assert/strict";
import { normalizeThemeMode } from "../lib/theme.ts";

test("theme mode accepts only supported values", () => {
  assert.equal(normalizeThemeMode("system"), "system");
  assert.equal(normalizeThemeMode("light"), "light");
  assert.equal(normalizeThemeMode("dark"), "dark");
});

test("theme mode rejects stale or invalid values", () => {
  assert.equal(normalizeThemeMode("auto"), null);
  assert.equal(normalizeThemeMode(""), null);
  assert.equal(normalizeThemeMode(null), null);
});
