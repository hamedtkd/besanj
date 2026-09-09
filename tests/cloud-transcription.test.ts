import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_GROQ_TRANSCRIPTION_MODEL,
  GROQ_TRANSCRIPTION_ENDPOINT,
  MAX_CLOUD_AUDIO_BYTES,
  PERSIAN_TRANSCRIPTION_PROMPT,
  cloudTranscriptionErrorMessage,
  isSupportedCloudAudioType,
  normalizeCloudTranscript,
  resolveGroqTranscriptionModel,
} from "../lib/cloud-transcription.ts";

test("cloud transcription defaults to accurate multilingual Whisper Large V3", () => {
  assert.equal(DEFAULT_GROQ_TRANSCRIPTION_MODEL, "whisper-large-v3");
  assert.equal(resolveGroqTranscriptionModel(undefined), "whisper-large-v3");
  assert.equal(resolveGroqTranscriptionModel("whisper-large-v3-turbo"), "whisper-large-v3-turbo");
  assert.equal(resolveGroqTranscriptionModel("unknown-model"), "whisper-large-v3");
});

test("cloud transcription uses Groq audio transcription endpoint and Persian context", () => {
  assert.equal(GROQ_TRANSCRIPTION_ENDPOINT, "https://api.groq.com/openai/v1/audio/transcriptions");
  assert.match(PERSIAN_TRANSCRIPTION_PROMPT, /فارسی/);
  assert.match(PERSIAN_TRANSCRIPTION_PROMPT, /قیمت/);
  assert.match(PERSIAN_TRANSCRIPTION_PROMPT, /شماره تلفن/);
});

test("cloud transcription accepts browser recording formats and caps upload size", () => {
  assert.equal(isSupportedCloudAudioType("audio/webm;codecs=opus"), true);
  assert.equal(isSupportedCloudAudioType("audio/ogg"), true);
  assert.equal(isSupportedCloudAudioType("audio/mp4"), true);
  assert.equal(isSupportedCloudAudioType("audio/wav"), true);
  assert.equal(isSupportedCloudAudioType("application/zip"), false);
  assert.equal(MAX_CLOUD_AUDIO_BYTES, 10 * 1024 * 1024);
});

test("cloud transcription response normalization is review-first text only", () => {
  assert.equal(normalizeCloudTranscript({ text: "  سامسونگ Q70  " }), "سامسونگ Q70");
  assert.equal(normalizeCloudTranscript({ text: 68 }), "");
  assert.equal(normalizeCloudTranscript(null), "");
});

test("cloud transcription exposes useful quota and credential errors", () => {
  assert.match(cloudTranscriptionErrorMessage(401), /کلید Groq/);
  assert.match(cloudTranscriptionErrorMessage(429), /سقف استفاده/);
  assert.match(cloudTranscriptionErrorMessage(503), /موقتاً/);
});
