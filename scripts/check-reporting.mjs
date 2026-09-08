import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "components/case-report-page.tsx",
  "components/case-timeline.tsx",
  "components/provider-contact-actions.tsx",
  "lib/case-report.ts",
  "lib/contact.ts",
  "tests/case-report.test.ts",
  "tests/contact.test.ts",
  "app/cases/[id]/report/page.tsx",
];

const violations = [];
for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    violations.push(`Missing reporting/communication file: ${file}`);
  }
}

const caseScreen = await readFile("components/case-screen.tsx", "utf8");
const comparison = await readFile("components/quote-comparison.tsx", "utf8");
const reportPage = await readFile("components/case-report-page.tsx", "utf8");
const globals = await readFile("app/globals.css", "utf8");
const reportLib = await readFile("lib/case-report.ts", "utf8");
const contactLib = await readFile("lib/contact.ts", "utf8");

if (!/CaseTimeline/.test(caseScreen) || !/\/report/.test(caseScreen)) {
  violations.push("Case screen must expose timeline and report entry points.");
}
if (!/ProviderContactActions/.test(comparison) || !/buildFollowUpMessage/.test(comparison)) {
  violations.push("Quote cards must expose quick provider contact actions with a prepared follow-up message.");
}
if (!/window\.print\(\)/.test(reportPage) || !/navigator\.share/.test(reportPage)) {
  violations.push("Report page must support print/PDF and native share fallback.");
}
if (!/@media print/.test(globals) || !/report-break-inside/.test(globals)) {
  violations.push("Printable report styles are missing.");
}
if (!/buildCaseReportSnapshot/.test(reportLib) || !/buildCaseTimeline/.test(reportLib)) {
  violations.push("Case report model and timeline builder must remain available.");
}
if (!/buildProviderContactLinks/.test(contactLib) || !/wa\.me/.test(contactLib)) {
  violations.push("Provider contact link builder must support phone/SMS/WhatsApp.");
}

if (violations.length) {
  console.error(
    "Reporting/communication guard violations:\n" +
      violations.map((item) => `- ${item}`).join("\n")
  );
  process.exit(1);
}

console.log(
  "Reporting/communication guard passed: timeline, quick contact, share and printable report are wired."
);
