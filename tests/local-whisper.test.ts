import assert from "node:assert/strict";
import test from "node:test";
import {
  LOCAL_WHISPER_LANGUAGE,
  LOCAL_WHISPER_MODEL_ID,
  extractWhisperText,
  resampleMonoAudio,
  whisperRuntimeAttempts,
} from "../lib/local-whisper.ts";

test("local whisper uses multilingual tiny model and Persian language", () => {
  assert.equal(LOCAL_WHISPER_MODEL_ID, "onnx-community/whisper-tiny");
  assert.equal(LOCAL_WHISPER_LANGUAGE, "fa");
});

test("local whisper prefers WebGPU but keeps a WASM fallback", () => {
  const attempts = whisperRuntimeAttempts(true);
  assert.equal(attempts[0].backend, "webgpu");
  assert.equal(attempts[1].backend, "wasm");
  assert.deepEqual(whisperRuntimeAttempts(false).map((item) => item.backend), ["wasm"]);
});

test("audio resampling mixes channels and returns 16k-compatible samples", () => {
  const left = new Float32Array([1, 1, 1, 1]);
  const right = new Float32Array([-1, -1, -1, -1]);
  const silentMono = resampleMonoAudio([left, right], 16_000);
  assert.deepEqual(Array.from(silentMono), [0, 0, 0, 0]);

  const source = new Float32Array(32_000).fill(0.25);
  const downsampled = resampleMonoAudio([source], 32_000);
  assert.equal(downsampled.length, 16_000);
  assert.equal(downsampled[0], 0.25);
  assert.equal(downsampled[downsampled.length - 1], 0.25);
});

test("whisper text extraction accepts single or chunked output", () => {
  assert.equal(extractWhisperText({ text: "  سامسونگ شصت و هشت میلیون  " }), "سامسونگ شصت و هشت میلیون");
  assert.equal(
    extractWhisperText([{ text: " سامسونگ " }, { text: " ۶۸ میلیون " }]),
    "سامسونگ ۶۸ میلیون"
  );
});
