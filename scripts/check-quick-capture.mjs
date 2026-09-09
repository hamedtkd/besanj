import fs from "node:fs";

function read(path) {
  return fs.readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const home = read("components/home-screen.tsx");
const quickSheet = read("components/quick-capture-sheet.tsx");
const voice = read("components/local-voice-capture.tsx");
const localSpeech = read("lib/local-speech.ts");
const quickLogic = read("lib/quick-capture.ts");
const quoteCapture = read("lib/quote-capture.ts");
const quoteForm = read("components/quote-form-dialog.tsx");
const tests = read("tests/quick-capture.test.ts");

const failures = [];

if (!home.includes("QuickCaptureSheet") || !home.includes("ثبت سریع")) {
  failures.push("dashboard quick-capture entry point is missing");
}
if (!quickSheet.includes("createPurchaseCase") || !quickSheet.includes("addQuote")) {
  failures.push("quick capture must create a case and/or quote through the existing DB helpers");
}
if (!quickSheet.includes("QUICK_CAPTURE_DRAFT_KEY") || !quickLogic.includes("besanj.quick-capture.v1")) {
  failures.push("local quick-capture draft persistence is missing");
}
if (!voice.includes("LocalVoiceCapture") || !localSpeech.includes("processLocally = true")) {
  failures.push("on-device voice capture is not wired");
}
if (!localSpeech.includes("available") || !localSpeech.includes("install")) {
  failures.push("on-device language-pack availability/install flow is missing");
}
if (/processLocally\s*=\s*false/.test(localSpeech)) {
  failures.push("cloud speech fallback is forbidden in the local-first quick capture flow");
}
if (!quoteCapture.includes("subjectTitle") || !quoteCapture.includes("availability")) {
  failures.push("natural quote parser does not expose subject/availability suggestions");
}
if (!quickLogic.includes("parseQuickToman") || !quickLogic.includes("assumedMillions")) {
  failures.push("smart quick amount parsing is missing");
}
if (!quoteForm.includes("جزئیات بیشتر، اختیاری")) {
  failures.push("quote form progressive disclosure is missing");
}
if (!tests.includes("voice-style quote text") || !tests.includes("bare small quick amount")) {
  failures.push("quick capture regression tests are missing");
}

if (failures.length) {
  console.error("Quick capture guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Quick capture guard passed: one-tap case/quote entry, smart amounts, local voice, drafts and progressive details are wired.");
