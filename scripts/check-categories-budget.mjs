import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "lib/categories.ts",
  "lib/budget.ts",
  "components/budget-settings-sheet.tsx",
  "components/budget-overview.tsx",
  "components/monthly-budget-summary.tsx",
  "tests/categories-budget.test.ts",
];

const violations = [];
for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    violations.push(`Missing categories/budget asset: ${file}`);
  }
}

const db = await readFile("lib/db.ts", "utf8");
const home = await readFile("components/home-screen.tsx", "utf8");
const createCase = await readFile("components/create-case-dialog.tsx", "utf8");
const planning = await readFile("components/case-planning-sheet.tsx", "utf8");
const insights = await readFile("components/insights-page.tsx", "utf8");
const insightLogic = await readFile("lib/insights.ts", "utf8");
const backup = await readFile("lib/backup.ts", "utf8");
const backupFormat = await readFile("lib/backup-format.ts", "utf8");

if (!/version\(5\)/.test(db) || !/budgetPlans/.test(db) || !/saveBudgetPlan/.test(db)) {
  violations.push("Dexie v5 must persist monthly and category budget settings.");
}
if (!/categoryKey/.test(createCase) || !/tagsText/.test(createCase) || !/CUSTOM_CATEGORY_VALUE/.test(createCase)) {
  violations.push("New case flow must capture category, custom category and tags.");
}
if (!/categoryKey/.test(planning) || !/tagsText/.test(planning)) {
  violations.push("Existing cases must support editing category and tags.");
}
if (!/categoryKey/.test(home) || !/tagOptions/.test(home) || !/MonthlyBudgetSummary/.test(home)) {
  violations.push("Dashboard must filter by category/tag and surface monthly budget usage.");
}
if (!/BudgetOverview/.test(insights) || !/CategorySpendChart/.test(insights)) {
  violations.push("Insights must expose budget status and category spending report.");
}
if (!/PurchaseInsightFilters/.test(insightLogic) || !/categorySpend/.test(insightLogic)) {
  violations.push("Insight aggregation must support category/tag filters and category spending.");
}
if (!/db\.budgetPlans\.toArray/.test(backup) || !/backup\.data\.budgetPlans/.test(backup)) {
  violations.push("Full backup and restore must include budget settings.");
}
if (!/budgetPlans\?/.test(backupFormat) || !/برچسب/.test(backupFormat)) {
  violations.push("Backup format must validate optional budget settings and case classification data.");
}

if (violations.length) {
  console.error(
    "Categories/budget guard violations:\n" +
      violations.map((item) => `- ${item}`).join("\n")
  );
  process.exit(1);
}

console.log(
  "Categories/budget guard passed: categories, tags, monthly/category budgets, filters, insights and backup are wired."
);
