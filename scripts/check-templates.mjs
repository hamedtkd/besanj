import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "lib/case-templates.ts",
  "components/template-picker-sheet.tsx",
  "components/save-template-sheet.tsx",
  "tests/case-templates.test.ts",
];

const violations = [];
for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    violations.push(`Missing templates asset: ${file}`);
  }
}

const db = await readFile("lib/db.ts", "utf8");
const home = await readFile("components/home-screen.tsx", "utf8");
const createCase = await readFile("components/create-case-dialog.tsx", "utf8");
const caseScreen = await readFile("components/case-screen.tsx", "utf8");
const backup = await readFile("lib/backup.ts", "utf8");
const backupFormat = await readFile("lib/backup-format.ts", "utf8");
const types = await readFile("lib/types.ts", "utf8");

if (!/version\(7\)/.test(db) || !/caseTemplates/.test(db) || !/saveCaseAsTemplate/.test(db)) {
  violations.push("Dexie v7 must persist personal case templates and expose save/use actions.");
}
if (!/CaseTemplate/.test(types) || !/requirementLabels/.test(types)) {
  violations.push("CaseTemplate model must keep reusable case planning fields without provider/quote data.");
}
if (!/TemplatePickerSheet/.test(home) || !/قالب‌ها/.test(home)) {
  violations.push("Dashboard must expose templates on desktop and mobile.");
}
if (!/initialTemplate/.test(createCase) || !/markCaseTemplateUsed/.test(createCase)) {
  violations.push("New case flow must accept an editable template and track successful personal-template use.");
}
if (!/SaveTemplateSheet/.test(caseScreen) || !/ذخیره قالب/.test(caseScreen)) {
  violations.push("Existing cases must be reusable as personal templates.");
}
if (!/db\.caseTemplates\.toArray/.test(backup) || !/backup\.data\.caseTemplates/.test(backup)) {
  violations.push("Full backup and restore must include personal templates.");
}
if (!/caseTemplates\?/.test(backupFormat) || !/قالب‌های پرونده/.test(backupFormat)) {
  violations.push("Backup format must remain backward-compatible while validating optional templates.");
}
if (/providerId|sellerProfileId|quoteId/.test(await readFile("lib/case-templates.ts", "utf8"))) {
  violations.push("Templates must not capture seller or quote identity.");
}

if (violations.length) {
  console.error(
    "Templates guard violations:\n" + violations.map((item) => `- ${item}`).join("\n")
  );
  process.exit(1);
}

console.log(
  "Templates guard passed: built-in and personal templates speed case creation, stay editable, exclude seller/quote identity, and survive backup/restore."
);
