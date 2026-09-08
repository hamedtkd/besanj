import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "app/manifest.ts",
  "app/icon.svg",
  "app/apple-icon.png",
  "app/favicon.ico",
  "public/brand/besanj.svg",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
  "public/icons/maskable-512.png",
  "public/sw.js",
  "components/pwa-register.tsx",
  "components/pwa-install-provider.tsx",
  "components/pwa-install-section.tsx",
  "hooks/use-pwa-install.ts",
];

const violations = [];
for (const file of requiredFiles) {
  try {
    await access(file);
  } catch {
    violations.push(`Missing PWA/brand asset: ${file}`);
  }
}

const manifest = await readFile("app/manifest.ts", "utf8");
const serviceWorker = await readFile("public/sw.js", "utf8");
const providers = await readFile("components/providers.tsx", "utf8");
const layout = await readFile("app/layout.tsx", "utf8");
const brand = await readFile("components/brand-mark.tsx", "utf8");
const nextConfig = await readFile("next.config.ts", "utf8");
const installSection = await readFile("components/pwa-install-section.tsx", "utf8");

if (!/display:\s*"standalone"/.test(manifest)) {
  violations.push("Manifest must use standalone display mode.");
}
if (!/name:\s*"بسنج"/.test(manifest) || !/short_name:\s*"بسنج"/.test(manifest)) {
  violations.push("Manifest app name and short name must be بسنج.");
}
if (!/applicationName:\s*"بسنج"/.test(layout) || !/title:\s*"بسنج"/.test(layout)) {
  violations.push("Root metadata and Apple Web App title must use بسنج.");
}
if (!/maskable-512\.png/.test(manifest) || !/purpose:\s*"maskable"/.test(manifest)) {
  violations.push("Manifest must include a maskable icon.");
}
if (!/navigator\.serviceWorker/.test(providers + (await readFile("components/pwa-register.tsx", "utf8")))) {
  violations.push("Service worker registration is missing.");
}
if (!/CACHE_VERSION/.test(serviceWorker) || !/besanj-shell-v11/.test(serviceWorker) || !/fetch/.test(serviceWorker)) {
  violations.push("Service worker cache/fetch strategy or Besanj cache version is missing.");
}
if (!/manifest:\s*"\/manifest\.webmanifest"/.test(layout)) {
  violations.push("Root metadata must link the web manifest.");
}
if (!/PwaInstallProvider/.test(providers)) {
  violations.push("PWA install provider must mount at app startup so the install prompt is not missed.");
}
if (!/نصب بسنج/.test(installSection)) {
  violations.push("PWA install action must use the Besanj brand name.");
}
if (!/\/brand\/besanj\.svg/.test(brand)) {
  violations.push("Navbar brand mark must use the provided Besanj logo.");
}
if (!/themeColor:\s*"#2563eb"/i.test(layout)) {
  violations.push("Default browser theme color must be the new blue brand color.");
}
if (!/source:\s*"\/sw\.js"/.test(nextConfig) || !/no-cache, no-store, must-revalidate/.test(nextConfig)) {
  violations.push("Service worker response must disable HTTP caching so updates are discovered promptly.");
}

if (violations.length) {
  console.error("PWA/brand guard violations:\n" + violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("PWA/brand guard passed: manifest, icons, service worker, install UI, and logo are wired.");
