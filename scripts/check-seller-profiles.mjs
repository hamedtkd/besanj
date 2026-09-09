import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "app/sellers/page.tsx",
  "app/sellers/[id]/page.tsx",
  "components/seller-directory-page.tsx",
  "components/seller-profile-page.tsx",
  "components/seller-profile-edit-sheet.tsx",
  "components/seller-merge-sheet.tsx",
  "lib/seller-profiles.ts",
  "tests/seller-profiles.test.ts",
];

const violations = [];
for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    violations.push(`Missing seller profile asset: ${file}`);
  }
}

const db = await readFile("lib/db.ts", "utf8");
const types = await readFile("lib/types.ts", "utf8");
const appShell = await readFile("components/app-shell.tsx", "utf8");
const profilePage = await readFile("components/seller-profile-page.tsx", "utf8");
const directoryPage = await readFile("components/seller-directory-page.tsx", "utf8");
const quoteForm = await readFile("components/quote-form-dialog.tsx", "utf8");
const quoteComparison = await readFile("components/quote-comparison.tsx", "utf8");
const providerHistory = await readFile("lib/provider-history.ts", "utf8");
const insights = await readFile("lib/insights.ts", "utf8");
const insightsPage = await readFile("components/insights-page.tsx", "utf8");
const backup = await readFile("lib/backup.ts", "utf8");
const backupFormat = await readFile("lib/backup-format.ts", "utf8");

if (!/version\(6\)/.test(db) || !/sellerProfiles/.test(db) || !/sellerProfileId/.test(db)) {
  violations.push("Dexie v6 must persist global seller profiles and link case providers to them.");
}
if (!/updateSellerProfile/.test(db) || !/mergeSellerProfiles/.test(db)) {
  violations.push("Seller profile global editing and duplicate merging must be implemented in the data layer.");
}
if (!/interface SellerProfile/.test(types) || !/favorite\?/.test(types) || !/avoid\?/.test(types)) {
  violations.push("SellerProfile type must include persistent identity and trust flags.");
}
if (!/href="\/sellers"/.test(appShell) || !/pathname\.startsWith\("\/sellers"\)/.test(appShell)) {
  violations.push("Seller directory must be discoverable from primary navigation.");
}
if (!/buildSellerProfileDetails/.test(profilePage) || !/setSellerFavorite/.test(profilePage) || !/setSellerAvoid/.test(profilePage) || !/SellerMergeSheet/.test(profilePage)) {
  violations.push("Seller profile page must expose history, trust flags, editing and merge actions.");
}
if (!/buildSellerDirectory/.test(directoryPage) || !/sellerMatchesSearch/.test(directoryPage) || !/پیشنهاد نمی‌شود/.test(directoryPage)) {
  violations.push("Seller directory must aggregate history and support search/favorite/avoid filtering.");
}
if (!/sellerProfileId/.test(quoteForm) || !/sellerProfileId/.test(quoteComparison)) {
  violations.push("Quote entry and comparison must preserve and surface global seller identity.");
}
if (!/providerSellerIdentityKey/.test(providerHistory) || !/providerSellerIdentityKey/.test(insights)) {
  violations.push("Provider reuse and insights must prefer stable seller profile identity.");
}
if (!/\/sellers\/\$\{seller\.sellerProfileId\}/.test(insightsPage)) {
  violations.push("Seller memory in Insights must link to the canonical seller profile when available.");
}
if (!/db\.sellerProfiles\.toArray/.test(backup) || !/backup\.data\.sellerProfiles/.test(backup)) {
  violations.push("Full backup and restore must include seller profiles.");
}
if (!/sellerProfiles\?/.test(backupFormat) || !/sellerProfileId/.test(backupFormat)) {
  violations.push("Backup parser must validate optional seller profiles and provider links while accepting older backups.");
}

if (violations.length) {
  console.error(
    "Seller profile guard violations:\n" +
      violations.map((item) => `- ${item}`).join("\n")
  );
  process.exit(1);
}

console.log(
  "Seller profile guard passed: canonical sellers, history, trust flags, merge, quote reuse, insights and backup are wired."
);
