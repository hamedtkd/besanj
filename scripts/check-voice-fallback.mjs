import { access, readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const voice = await readFile("components/local-voice-capture.tsx", "utf8");
const localSpeech = await readFile("lib/local-speech.ts", "utf8");
const whisper = await readFile("lib/local-whisper.ts", "utf8");
const loader = await readFile("public/vendor/transformers-loader.mjs", "utf8");
const serviceWorker = await readFile("public/sw.js", "utf8");
const tests = await readFile("tests/local-whisper.test.ts", "utf8");

const failures = [];
const loaderPath = "/vendor/transformers-loader.mjs";
const pinnedRuntime = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js";

if (pkg.version !== "1.6.0") {
  failures.push("package version must be 1.6.0");
}
if (pkg.dependencies?.["@huggingface/transformers"]) {
  failures.push("Transformers.js must not be installed through npm because its Node-only dependency tree is not needed by the browser fallback");
}
if (!pkg.scripts?.check?.includes("check:voice-fallback")) {
  failures.push("voice fallback guard is not part of the full check pipeline");
}
try {
  await access("public/vendor/transformers-loader.mjs");
} catch {
  failures.push("browser Transformers.js loader is missing");
}
if (!loader.includes(pinnedRuntime)) {
  failures.push("Transformers.js browser runtime must use the exact pinned 4.2.0 CDN bundle");
}
if (!loader.includes("__BESANJ_TRANSFORMERS__") || !loader.includes("besanj-transformers-ready")) {
  failures.push("browser runtime loader must expose the ready module without bundling it into Next.js");
}
if (!voice.includes("localSpeechAvailability") || !voice.includes("startWhisperFallback") || !voice.includes("تشخیص محلی")) {
  failures.push("explicit local speech mode with local Whisper fallback is not wired");
}
if (!voice.includes("navigator.mediaDevices.getUserMedia") || !voice.includes("MediaRecorder")) {
  failures.push("browser microphone recording for local Whisper is missing");
}
if (!voice.includes("transcribeRecordedAudio") || !voice.includes("فایل عمومی مدل")) {
  failures.push("local transcription or privacy disclosure is missing");
}
if (!localSpeech.includes("processLocally = true") || /processLocally\s*=\s*false/.test(localSpeech)) {
  failures.push("browser speech path must remain strictly on-device");
}
if (!whisper.includes('onnx-community/whisper-tiny') || !whisper.includes('LOCAL_WHISPER_LANGUAGE = "fa"')) {
  failures.push("multilingual Whisper Tiny with explicit Persian language is missing");
}
if (!whisper.includes(`TRANSFORMERS_LOADER_PATH = "${loaderPath}"`)) {
  failures.push("local Whisper must lazy-load the browser runtime through the same-origin loader");
}
if (whisper.includes('import("@huggingface/transformers")')) {
  failures.push("local Whisper must not pull the npm Transformers.js package into the Next.js dependency graph");
}
if (!whisper.includes("useBrowserCache = true") || !whisper.includes("useWasmCache = true")) {
  failures.push("browser model/WASM caching is not explicitly enabled");
}
if (!whisper.includes('backend: "webgpu"') || !whisper.includes('backend: "wasm"')) {
  failures.push("WebGPU preference with WASM fallback is missing");
}
if (!whisper.includes('language: LOCAL_WHISPER_LANGUAGE') || !whisper.includes('task: "transcribe"')) {
  failures.push("Whisper transcription must force Persian transcription mode");
}
if (!whisper.includes('typeof navigator.mediaDevices?.getUserMedia === "function"')) {
  failures.push("microphone capability detection must be type-safe");
}
if (/processLocally\s*=\s*false/.test(localSpeech) || /OPENAI_API_KEY|HF_TOKEN|Authorization:\s*Bearer/i.test(localSpeech + whisper + loader)) {
  failures.push("the local voice path must remain on-device and must not contain cloud credentials");
}
if (!serviceWorker.includes(loaderPath) || !serviceWorker.includes("besanj-shell-v19")) {
  failures.push("PWA shell v19 must cache the same-origin Transformers.js loader");
}
if (!tests.includes("WASM fallback") || !tests.includes("16k-compatible")) {
  failures.push("local Whisper regression tests are missing");
}

if (failures.length) {
  console.error("Voice fallback guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Voice fallback guard passed: the optional local speech path stays on-device and the pinned browser-only Whisper runtime avoids Node-only npm dependencies.");
