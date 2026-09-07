import { readFile } from "node:fs/promises";

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const files = [
  "components/providers.tsx",
  "components/app-theme.tsx",
  "components/theme-quick-actions.tsx",
  "components/settings-sheet.tsx",
  "components/app-preferences.tsx",
];
const combined = (await Promise.all(files.map((file) => readFile(file, "utf8")))).join("\n");
const sheet = await readFile("components/ui/responsive-sheet.tsx", "utf8");

const violations = [];
if (packageJson.dependencies?.["next-themes"]) {
  violations.push("next-themes must not be present; React 19/Next 16 can emit an inline-script warning from it.");
}
if (/from ["']next-themes["']/.test(combined)) {
  violations.push("A source file still imports next-themes.");
}
if (/<script\b/i.test(combined)) {
  violations.push("Theme runtime must not render a raw script from a client component.");
}
if (!/createPortal\(/.test(sheet) || !/document\.body/.test(sheet)) {
  violations.push("ResponsiveSheet must portal to document.body so Navbar/header containing blocks cannot clip dialogs.");
}
if (!/useSyncExternalStore/.test(sheet)) {
  violations.push("ResponsiveSheet must delay its portal until after hydration without effect-driven mounted state.");
}

if (violations.length) {
  console.error("Theme/runtime guard violations:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Theme/runtime guard passed: no next-themes script path and sheets portal to body.");
