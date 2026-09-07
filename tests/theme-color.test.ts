import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomThemeTokens,
  normalizeHexColor,
  normalizeSavedThemeColors,
  readableForeground,
} from "../lib/theme-color.ts";

test("custom theme normalizes short and long hex", () => {
  assert.equal(normalizeHexColor("#DB2777"), "#db2777");
  assert.equal(normalizeHexColor("abc"), "#aabbcc");
  assert.equal(normalizeHexColor("not-a-color"), null);
});

test("custom theme chooses readable foreground", () => {
  assert.equal(readableForeground("#111111"), "#ffffff");
  assert.equal(readableForeground("#ffffff"), "#111111");
});

test("custom theme tokens include chart and border colors", () => {
  const tokens = buildCustomThemeTokens("#2563eb", false);
  assert.equal(tokens["--primary"], "#2563eb");
  assert.ok(tokens["--chart-1"].startsWith("#"));
  assert.ok(tokens["--glass-border"].includes("rgb("));
});

test("saved theme colors are deduplicated and capped", () => {
  const input = [
    "#111111",
    "#111",
    "#222222",
    "#333333",
    "#444444",
    "#555555",
    "#666666",
    "#777777",
    "#888888",
    "#999999",
  ];
  const colors = normalizeSavedThemeColors(input);
  assert.equal(colors.length, 8);
  assert.equal(colors[0], "#111111");
});
