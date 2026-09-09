import { readFile } from "node:fs/promises";
import { join } from "node:path";

const ROOT = process.cwd();

async function read(path) {
  return readFile(join(ROOT, path), "utf8");
}

const tooltip = await read("components/ui/tooltip.tsx");
const helpHint = await read("components/help-hint.tsx");
const providers = await read("components/providers.tsx");
const sheet = await read("components/ui/responsive-sheet.tsx");
const formField = await read("components/ui/form-field.tsx");
const voice = await read("components/local-voice-capture.tsx");

const violations = [];

if (!tooltip.includes('@base-ui/react/tooltip')) {
  violations.push("Tooltip must use PersianLabs/Base UI tooltip primitive.");
}
if (!tooltip.includes('DirectionProvider') || !tooltip.includes('TooltipDirContext')) {
  violations.push("Tooltip must preserve PersianLabs RTL portal direction handling.");
}
if (!tooltip.includes('data-slot="tooltip-content"')) {
  violations.push("TooltipContent slot is missing.");
}
if (!tooltip.includes('z-[90]')) {
  violations.push("Tooltip must render above ResponsiveSheet layers.");
}
if (!helpHint.includes('CircleHelp') || !helpHint.includes('TooltipTrigger') || !helpHint.includes('Button')) {
  violations.push("HelpHint must compose the PersianLabs Tooltip with the PersianLabs Button and a help icon.");
}
if (!helpHint.includes('data-help-hint')) {
  violations.push("HelpHint must expose the shared data-help-hint marker.");
}
if (!providers.includes('<TooltipProvider delay={300}>')) {
  violations.push("TooltipProvider must wrap the app globally.");
}
if (!sheet.includes('<HelpHint label={`راهنمای ${title}`} side="bottom">')) {
  violations.push("ResponsiveSheet descriptions must move into the shared HelpHint.");
}
if (/\{description\}\s*<\/p>/.test(sheet)) {
  violations.push("ResponsiveSheet description must not be permanently rendered as helper copy.");
}
if (!formField.includes('hint ? <HelpHint')) {
  violations.push("FormField hints must use HelpHint globally.");
}
if (!formField.includes('<FieldError match={true}>{error}</FieldError>')) {
  violations.push("Form errors must remain visible and must not be hidden in tooltips.");
}
if (!voice.includes('<HelpHint label="راهنمای تشخیص صدا"')) {
  violations.push("Voice privacy/help copy must use HelpHint.");
}
if (voice.includes('حالت هوش مصنوعی برای دقت بیشتر فقط صدای همین ضبط را برای تبدیل به متن به Groq می فرستد')) {
  violations.push("Legacy always-visible cloud voice explanation must be removed.");
}

const siteFiles = [
  "components/home-screen.tsx",
  "components/today-queue.tsx",
  "components/quote-capture-panel.tsx",
  "components/quick-capture-sheet.tsx",
  "components/settings-sheet.tsx",
  "components/notification-settings-section.tsx",
  "components/data-backup-section.tsx",
  "components/budget-overview.tsx",
  "components/case-details-panel.tsx",
  "components/case-screen.tsx",
  "components/case-timeline.tsx",
  "components/decision-assistant.tsx",
  "components/price-history-chart.tsx",
  "components/quote-history.tsx",
  "components/seller-directory-page.tsx",
  "components/seller-profile-page.tsx",
  "components/insights-page.tsx",
  "components/pwa-install-section.tsx",
];

let adopted = 0;
for (const file of siteFiles) {
  const source = await read(file);
  if (source.includes('HelpHint')) adopted += 1;
}
if (adopted < 16) {
  violations.push(`HelpHint site-wide adoption is too small: ${adopted}/${siteFiles.length}.`);
}

const notificationSettings = await read("components/notification-settings-section.tsx");
const dataBackup = await read("components/data-backup-section.tsx");
const caseScreen = await read("components/case-screen.tsx");
if (!notificationSettings.includes("بسنج هنوز Backend/Push Server ندارد")) {
  violations.push("Critical notification limitation must remain visible.");
}
if (!dataBackup.includes("داده فعلی این مرورگر با محتوای فایل جایگزین می‌شود")) {
  violations.push("Destructive restore warning must remain visible.");
}
if (!caseScreen.includes("انتخاب نهایی هنوز به قیمت قبلی اشاره می‌کند")) {
  violations.push("Stale selected-quote warning must remain visible.");
}

if (violations.length) {
  console.error("Tooltip/help policy violations:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log(`Tooltip/help guard passed: PersianLabs Tooltip is global, RTL-safe, and adopted across ${adopted} key surfaces while critical warnings stay visible.`);
