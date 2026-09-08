import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "components/today-queue.tsx",
  "components/case-follow-up-sheet.tsx",
  "components/case-planning-sheet.tsx",
  "components/provider-rating-sheet.tsx",
  "lib/follow-up.ts",
  "lib/planning.ts",
  "lib/attachments.ts",
];

const violations = [];
for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    violations.push(`Missing phase 0.5 workflow file: ${file}`);
  }
}

const db = await readFile("lib/db.ts", "utf8");
const home = await readFile("components/home-screen.tsx", "utf8");
const caseScreen = await readFile("components/case-screen.tsx", "utf8");
const quoteForm = await readFile("components/quote-form-dialog.tsx", "utf8");
const types = await readFile("lib/types.ts", "utf8");

if (!/this\.version\(4\)/.test(db) || !/reminders:/.test(db) || !/attachments:/.test(db)) {
  violations.push("Dexie schema v4 must include reminders and attachments stores.");
}
if (!/targetBudgetToman/.test(types) || !/requirements/.test(types) || !/rating\?: number/.test(types)) {
  violations.push("Planning and provider rating fields are missing from domain types.");
}
if (!/TodayQueue/.test(home) || !/buildDashboardTasks/.test(home)) {
  violations.push("Dashboard TodayQueue is not wired.");
}
if (!/CaseFollowUpSheet/.test(caseScreen) || !/CaseDetailsPanel/.test(caseScreen)) {
  violations.push("Case follow-up/details workflow is not wired.");
}
if (!/type="file"/.test(quoteForm) || !/requirementChecks/.test(quoteForm)) {
  violations.push("Quote form must support attachments and requirement coverage.");
}

if (violations.length) {
  console.error("Workflow guard violations:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Workflow guard passed: follow-up, planning, ratings, requirements and attachments are wired.");
