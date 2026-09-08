import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "components/data-backup-section.tsx",
  "components/duplicate-case-sheet.tsx",
  "lib/backup-format.ts",
  "lib/backup.ts",
  "lib/duplicate-case.ts",
  "tests/backup.test.ts",
  "tests/duplicate-case.test.ts",
];

const violations = [];
for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    violations.push(`Missing data portability file: ${file}`);
  }
}

const settings = await readFile("components/settings-sheet.tsx", "utf8");
const db = await readFile("lib/db.ts", "utf8");
const quoteForm = await readFile("components/quote-form-dialog.tsx", "utf8");
const caseDetails = await readFile("components/case-details-panel.tsx", "utf8");
const backup = await readFile("lib/backup.ts", "utf8");
const backupFormat = await readFile("lib/backup-format.ts", "utf8");

if (!/DataBackupSection/.test(settings)) {
  violations.push("Settings must expose full backup and restore.");
}
if (!/duplicatePurchaseCase/.test(db) || !/db\.providers\.bulkAdd/.test(db)) {
  violations.push("Repeated purchase must duplicate the case and optionally its providers.");
}
if (!/providerChoice/.test(quoteForm) || !/انتخاب سریع فروشنده قبلی/.test(quoteForm)) {
  violations.push("Quote form must support selecting an existing provider.");
}
if (!/DuplicateCaseSheet/.test(caseDetails) || !/خرید مشابه/.test(caseDetails)) {
  violations.push("Case details must expose the repeated-purchase flow.");
}
if (!/db\.attachments\.clear/.test(backup) || !/bulkAdd\(attachments\)/.test(backup)) {
  violations.push("Restore must replace attachment storage, including binary files.");
}
if (!/BESANJ_BACKUP_FORMAT/.test(backupFormat) || !/dataBase64/.test(backupFormat)) {
  violations.push("Backup format must be versioned and preserve attachment bytes.");
}

if (violations.length) {
  console.error(
    "Data portability guard violations:\n" +
      violations.map((item) => `- ${item}`).join("\n")
  );
  process.exit(1);
}

console.log(
  "Data portability guard passed: backup/restore, repeated purchases and existing-provider reuse are wired."
);
