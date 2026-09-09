import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const FONT_COMMIT = "9dea055eb3dfc752879442224460c6e5d6ebe232";
const FONT_TOKEN = `Mikhak@${FONT_COMMIT}/fonts/webfonts/variable/Mikhak-FD%5BDSTY%2CKSHD%2Cwght%5D.woff2`;
const violations = [];

async function read(file) {
  return readFile(file, "utf8");
}

async function sourceFiles(root) {
  const out = [];
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (/\.(ts|tsx)$/.test(entry.name)) out.push(full);
    }
  }
  await walk(root);
  return out;
}

const css = await read("app/globals.css");
const layout = await read("app/layout.tsx");
const serviceWorker = await read("public/sw.js");
const numberHelpers = await read("lib/persian-number.ts");
const persianDate = await read("lib/persian-date.ts");
const format = await read("lib/format.ts");
const thirdParty = await read("THIRD_PARTY.md");
const packageJson = JSON.parse(await read("package.json"));

if (!css.includes(FONT_TOKEN)) {
  violations.push("Mikhak FD variable font must be pinned to the approved upstream commit.");
}
if (/Mikhak@master/.test(css) || /variable\/Mikhak%5B/.test(css)) {
  violations.push("Mutable or non-FD Mikhak font source is forbidden.");
}
if (!/font-family:\s*"Mikhak"/.test(css) || !/--font-sans:\s*"Mikhak"/.test(css)) {
  violations.push("Mikhak must remain the global and Tailwind sans font.");
}
if (!/\.recharts-text[\s\S]*font-family:\s*"Mikhak"/.test(css)) {
  violations.push("Recharts labels must inherit Mikhak explicitly.");
}
if (!/lang="fa"/.test(layout) || !/dir="rtl"/.test(layout)) {
  violations.push("Root layout must stay Persian RTL.");
}
if (!serviceWorker.includes(FONT_TOKEN) || !serviceWorker.includes("besanj-shell-v16")) {
  violations.push("PWA must cache the pinned Mikhak FD font with shell v16.");
}
if (!numberHelpers.includes('PERSIAN_NUMBER_LOCALE = "fa-IR-u-nu-arabext"')) {
  violations.push("Persian number locale must explicitly force arabext digits.");
}
if (!numberHelpers.includes('PERSIAN_DATE_LOCALE = "fa-IR-u-ca-persian-nu-arabext"')) {
  violations.push("Persian date locale must explicitly force the Persian calendar and digits.");
}
if (!/\[٠-٩\]/.test(numberHelpers) || !/\[0-9\]/.test(numberHelpers)) {
  violations.push("Digit normalization must cover Latin and Arabic-Indic input digits.");
}
if (!persianDate.includes("PERSIAN_DATE_LOCALE") || !format.includes("PERSIAN_NUMBER_LOCALE")) {
  violations.push("Date and display formatters must use centralized Persian locales.");
}
if (!thirdParty.includes("Mikhak") || !thirdParty.includes("SIL Open Font License 1.1")) {
  violations.push("Third-party notes must document the Mikhak source and license.");
}
if (!packageJson.scripts?.["check:persian-ui"] || !packageJson.scripts.check.includes("check:persian-ui")) {
  violations.push("check:persian-ui must be wired into the full check pipeline.");
}

const files = [
  ...(await sourceFiles("app")),
  ...(await sourceFiles("components")),
  ...(await sourceFiles("lib")),
];

const legacyPatterns = [
  { regex: /\.toLocaleString\(\s*["']fa-IR["']/, message: "toLocaleString must force arabext digits" },
  { regex: /Intl\.NumberFormat\(\s*["']fa-IR["']/, message: "Intl.NumberFormat must force arabext digits" },
  { regex: /Intl\.DateTimeFormat\(\s*["']fa-IR-u-ca-persian["']/, message: "Persian DateTimeFormat must force arabext digits" },
];

const plainLiteralPatterns = [
  /"([^"\\]*(?:\\.[^"\\]*)*)"/g,
  /'([^'\\]*(?:\\.[^'\\]*)*)'/g,
  /`([^`\\]*(?:\\.[^`\\]*)*)`/g,
];

for (const file of files) {
  if (file.endsWith("spoken-persian-number.ts")) continue;
  const content = await read(file);
  for (const item of legacyPatterns) {
    if (item.regex.test(content)) violations.push(`${file}: ${item.message}.`);
  }

  for (const regex of plainLiteralPatterns) {
    for (const match of content.matchAll(regex)) {
      const literal = match[1];
      if (literal.includes("${")) continue;
      if (/[\u0600-\u06ff]/.test(literal) && /[0-9]/.test(literal)) {
        violations.push(`${file}: Persian user-facing string contains Latin digits: ${literal}`);
      }
    }
  }
}

if (violations.length) {
  console.error("Persian UI guard violations:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Persian UI guard passed: Mikhak FD, Persian digits, Persian dates, RTL and PWA font caching are wired.");
