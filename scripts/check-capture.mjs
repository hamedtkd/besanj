import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const errors = [];

const requiredFiles = [
  "components/quote-capture-panel.tsx",
  "lib/quote-capture.ts",
  "lib/provider-history.ts",
  "tests/quote-capture.test.ts",
  "tests/provider-history.test.ts",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`missing ${file}`);
}

const quoteForm = read("components/quote-form-dialog.tsx");
if (!quoteForm.includes("QuoteCapturePanel") || !quoteForm.includes("parseQuoteCapture") && !read("components/quote-capture-panel.tsx").includes("parseQuoteCapture")) {
  errors.push("quote capture parser is not wired into the quote form");
}
if (!quoteForm.includes("buildProviderSuggestions") || !quoteForm.includes("allProviders")) {
  errors.push("cross-case provider reuse is not wired into the quote form");
}

const caseScreen = read("components/case-screen.tsx");
if (!caseScreen.includes("db.providers.toArray()") || !caseScreen.includes("allProviders={data.allProviders}")) {
  errors.push("case screen does not supply provider history to quote form");
}

const packageJson = JSON.parse(read("package.json"));
if (packageJson.version !== "0.9.0") errors.push("package version must be 0.9.0");
if (!packageJson.scripts?.["check:capture"]) errors.push("check:capture script is missing");
if (!String(packageJson.scripts?.check ?? "").includes("check:capture")) {
  errors.push("main check pipeline does not include check:capture");
}

if (errors.length) {
  console.error("Capture/provider-history guard violations:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Capture/provider-history guard passed: paste parsing, review-first quote entry and cross-case seller reuse are wired.");
