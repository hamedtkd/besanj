import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const errors = [];

const requiredFiles = [
  "components/notification-provider.tsx",
  "components/notification-settings-section.tsx",
  "components/task-quick-link.tsx",
  "lib/notifications.ts",
  "tests/notifications.test.ts",
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) errors.push(`missing ${file}`);
}

const providers = read("components/providers.tsx");
if (!providers.includes("NotificationProvider")) errors.push("NotificationProvider is not mounted globally");

const queue = read("components/today-queue.tsx");
if (!queue.includes("snoozeReminder") || !queue.includes("انجام شد")) {
  errors.push("TodayQueue must expose snooze and done reminder actions");
}

const settings = read("components/settings-sheet.tsx");
if (!settings.includes("NotificationSettingsSection")) {
  errors.push("notification settings are not wired into SettingsSheet");
}

const serviceWorker = read("public/sw.js");
if (!serviceWorker.includes('notificationclick')) errors.push("service worker notification click routing is missing");
if (!serviceWorker.includes('besanj-shell-v9')) errors.push("service worker cache was not bumped for v0.8");

const packageJson = JSON.parse(read("package.json"));
if (packageJson.version !== "0.8.0") errors.push("package version must be 0.8.0");
if (!packageJson.scripts?.["check:automation"]) errors.push("check:automation script is missing");
if (!String(packageJson.scripts?.check ?? "").includes("check:automation")) {
  errors.push("main check pipeline does not include check:automation");
}

if (errors.length) {
  console.error("Automation/notification guard violations:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log("Automation/notification guard passed: permission UI, daily notification ledger, app badge, snooze and service-worker routing are wired.");
