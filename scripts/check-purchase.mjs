import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const errors = [];

const requiredFiles = [
  "components/purchase-outcome-sheet.tsx",
  "components/purchase-outcome-card.tsx",
  "lib/purchase-outcome.ts",
  "tests/purchase-outcome.test.ts",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`missing ${file}`);
}

const types = read("lib/types.ts");
const db = read("lib/db.ts");
const caseScreen = read("components/case-screen.tsx");
const report = read("lib/case-report.ts");
const followUp = read("lib/follow-up.ts");
const backup = read("lib/backup-format.ts");
const backupRuntime = read("lib/backup.ts");

if (!types.includes("purchaseOutcome?: PurchaseOutcome") || !types.includes('PurchaseOutcomeStatus = "ordered" | "received"')) {
  errors.push("purchase outcome domain fields are missing");
}
if (!db.includes("setPurchaseOutcome") || !db.includes("clearPurchaseOutcome") || !db.includes("ابتدا ثبت خرید را پاک یا ویرایش کن")) {
  errors.push("purchase outcome persistence/invariant is not wired");
}
if (!caseScreen.includes("PurchaseOutcomeCard") || !caseScreen.includes("PurchaseOutcomeSheet")) {
  errors.push("purchase outcome UI is not wired into case screen");
}
if (!report.includes('kind: "purchase"') || !report.includes("نتیجه خرید")) {
  errors.push("report/timeline does not include purchase outcome");
}
if (!followUp.includes('kind: "delivery"') || !followUp.includes("expectedDeliveryAt")) {
  errors.push("delivery follow-up task is not wired");
}
if (!backup.includes("purchaseOutcomes") || !backupRuntime.includes("BESANJ_APP_VERSION")) {
  errors.push("backup validation/version does not cover purchase outcome");
}

const packageJson = JSON.parse(read("package.json"));
const majorVersion = Number(String(packageJson.version ?? "0").split(".")[0]);
if (!Number.isFinite(majorVersion) || majorVersion < 1) errors.push("package version must be 1.0.0 or newer");
if (!packageJson.scripts?.["check:purchase"]) errors.push("check:purchase script is missing");
if (!String(packageJson.scripts?.check ?? "").includes("check:purchase")) {
  errors.push("main check pipeline does not include check:purchase");
}

if (errors.length) {
  console.error("Purchase completion guard violations:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Purchase completion guard passed: final payment, delivery tracking, report/timeline and backup integrity are wired.");
