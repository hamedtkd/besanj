import { access, readFile } from "node:fs/promises";

const required = [
  "app/insights/page.tsx",
  "components/insights-page.tsx",
  "lib/insights.ts",
  "tests/insights.test.ts",
  ".gitattributes",
];

const violations = [];
for (const file of required) {
  try {
    await access(file);
  } catch {
    violations.push(`Missing insights asset: ${file}`);
  }
}

const appShell = await readFile("components/app-shell.tsx", "utf8");
const home = await readFile("components/home-screen.tsx", "utf8");
const insights = await readFile("lib/insights.ts", "utf8");
const page = await readFile("components/insights-page.tsx", "utf8");
const attributes = await readFile(".gitattributes", "utf8");

if (!/href="\/insights"/.test(appShell + home)) {
  violations.push("Insights must be discoverable from navigation/home.");
}
if (!/buildPurchaseInsights/.test(insights) || !/providerIdentity/.test(insights)) {
  violations.push("Purchase insight aggregation and seller memory are missing.");
}
if (!/totalSavingsVsHighestToman/.test(insights) || !/onTimeDeliveryRate/.test(insights)) {
  violations.push("Savings and delivery insight metrics are missing.");
}
if (!/حافظه فروشنده‌ها/.test(page) || !/روند هزینه خرید/.test(page)) {
  violations.push("Insights UI must expose seller memory and spend trend.");
}
if (!/^\* text=auto eol=lf/m.test(attributes)) {
  violations.push("Repository line endings must be pinned to LF in .gitattributes.");
}

if (violations.length) {
  console.error("Insights guard violations:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Insights guard passed: purchase analytics, seller memory, spend trend and LF normalization are wired.");
