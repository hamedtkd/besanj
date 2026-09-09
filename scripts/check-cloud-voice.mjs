import { readFile } from "node:fs/promises";

const pkg = JSON.parse(await readFile("package.json", "utf8"));
const voice = await readFile("components/local-voice-capture.tsx", "utf8");
const route = await readFile("app/api/transcribe/route.ts", "utf8");
const cloud = await readFile("lib/cloud-transcription.ts", "utf8");
const envExample = await readFile(".env.example", "utf8");
const tests = await readFile("tests/cloud-transcription.test.ts", "utf8");

const failures = [];

if (!pkg.scripts?.check?.includes("check:cloud-voice")) {
  failures.push("cloud voice guard is not part of the full check pipeline");
}
if (!voice.includes("با هوش مصنوعی بگو") || !voice.includes("transcribeCloudAudio")) {
  failures.push("AI voice action is not wired into quick capture");
}
if (!voice.includes("تشخیص محلی") || !voice.includes("startWhisperFallback")) {
  failures.push("privacy-preserving local voice option must remain available");
}
if (!route.includes("process.env.GROQ_API_KEY") || route.includes("NEXT_PUBLIC_GROQ")) {
  failures.push("Groq API key must remain server-only");
}
if (!route.includes('upstream.append("language", "fa")')) {
  failures.push("Groq transcription must force Persian language");
}
if (!route.includes("PERSIAN_TRANSCRIPTION_PROMPT") || !cloud.includes("استعلام خرید")) {
  failures.push("purchase-domain transcription prompt is missing");
}
if (!cloud.includes('DEFAULT_GROQ_TRANSCRIPTION_MODEL = "whisper-large-v3"')) {
  failures.push("accurate Whisper Large V3 must be the default cloud model");
}
if (!cloud.includes("MAX_CLOUD_AUDIO_BYTES") || !route.includes("MAX_CLOUD_AUDIO_BYTES")) {
  failures.push("cloud audio upload size limit is missing");
}
if (!route.includes('"Cache-Control": "no-store, max-age=0"')) {
  failures.push("transcription responses must not be cached");
}
if (!envExample.includes("GROQ_API_KEY=") || !envExample.includes("GROQ_TRANSCRIBE_MODEL=whisper-large-v3")) {
  failures.push("safe server environment example is missing");
}
if (JSON.stringify(pkg).includes("groq-sdk") || JSON.stringify(pkg).includes("@huggingface/transformers")) {
  failures.push("cloud voice must not add unnecessary npm SDK dependency trees");
}
if (!tests.includes("Whisper Large V3") || !tests.includes("quota and credential")) {
  failures.push("cloud voice regression tests are missing");
}

if (failures.length) {
  console.error("Cloud voice guard failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Cloud voice guard passed: Groq Whisper Large V3 is proxied server-side, Persian-first, review-first, and local voice remains available.");
