import { access, readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const priceIntelligence = await readFile("lib/price-intelligence.ts", "utf8");
const caseCard = await readFile("components/case-price-intelligence.tsx", "utf8");
const personalCard = await readFile("components/personal-price-intelligence.tsx", "utf8");
const sellerCard = await readFile("components/seller-price-intelligence.tsx", "utf8");
const caseScreen = await readFile("components/case-screen.tsx", "utf8");
const insightsPage = await readFile("components/insights-page.tsx", "utf8");
const sellerPage = await readFile("components/seller-profile-page.tsx", "utf8");
const tests = await readFile("tests/price-intelligence.test.ts", "utf8");

const failures = [];

for (const file of [
  "lib/price-intelligence.ts",
  "components/case-price-intelligence.tsx",
  "components/personal-price-intelligence.tsx",
  "components/seller-price-intelligence.tsx",
  "tests/price-intelligence.test.ts",
]) {
  try {
    await access(file);
  } catch {
    failures.push(`missing price intelligence file: ${file}`);
  }
}

if (packageJson.version !== "1.7.0") {
  failures.push("package version must be 1.7.0");
}
if (!packageJson.scripts?.["check:price-intelligence"] || !packageJson.scripts.check.includes("check:price-intelligence")) {
  failures.push("price intelligence guard must be wired into the full check pipeline");
}
if (!priceIntelligence.includes("dailyBestPrices") || !priceIntelligence.includes("buildCasePriceIntelligence")) {
  failures.push("case price history analysis is missing");
}
if (!priceIntelligence.includes("buildSellerPriceIntelligence") || !priceIntelligence.includes("medianPremiumPercent")) {
  failures.push("seller price position must normalize seller prices inside each case");
}
if (!priceIntelligence.includes("buildPersonalPriceIntelligence") || !priceIntelligence.includes("bestOpportunity")) {
  failures.push("personal price intelligence summary and opportunity signal are missing");
}
if (!priceIntelligence.includes('currentFreshness === "stale"') || !priceIntelligence.includes('currentFreshness === "expired"')) {
  failures.push("stale or expired current prices must not be presented as a favorable signal");
}
if (/\bfetch\s*\(|https?:\/\/|GROQ|OPENAI|Authorization/i.test(priceIntelligence + caseCard + personalCard + sellerCard)) {
  failures.push("price intelligence must remain local-only and must not call external price or AI services");
}
if (!caseScreen.includes("CasePriceIntelligence") || !caseScreen.includes("purchaseCase={purchaseCase}")) {
  failures.push("case screen must surface personal price intelligence");
}
if (!insightsPage.includes("PersonalPriceIntelligence") || !insightsPage.includes("sellerProfiles={data.sellerProfiles}")) {
  failures.push("insights page must surface cross-case personal price intelligence");
}
if (!sellerPage.includes("SellerPriceIntelligenceCard")) {
  failures.push("seller profile must surface normalized price position");
}
if (!caseCard.includes("فقط") && !personalCard.includes("فقط داده‌های خودت")) {
  failures.push("price intelligence UI must disclose that it is based on the user's own data");
}
if (!tests.includes("stale current best") || !tests.includes("consistently expensive seller") || !tests.includes("fresh active opportunity")) {
  failures.push("price intelligence regression tests are incomplete");
}

if (failures.length) {
  console.error("Price intelligence guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Price intelligence guard passed: case history, personal opportunity signals, and seller price position stay local and evidence-based.");
