export const LOCAL_WHISPER_MODEL_ID = "onnx-community/whisper-tiny";
export const LOCAL_WHISPER_LANGUAGE = "fa";
export const LOCAL_WHISPER_SAMPLE_RATE = 16_000;
export const TRANSFORMERS_LOADER_PATH = "/vendor/transformers-loader.mjs";

export type LocalWhisperStage =
  | "loading-library"
  | "loading-model"
  | "downloading"
  | "ready"
  | "transcribing";

export interface LocalWhisperProgress {
  stage: LocalWhisperStage;
  progress?: number;
  file?: string;
  backend?: "webgpu" | "wasm";
}

type ProgressCallback = (progress: LocalWhisperProgress) => void;

type AsrOutput = { text?: string } | Array<{ text?: string }>;
type AsrPipeline = (
  audio: Float32Array,
  options?: Record<string, unknown>
) => Promise<AsrOutput>;

type PipelineFactory = (
  task: "automatic-speech-recognition",
  model: string,
  options?: Record<string, unknown>
) => Promise<AsrPipeline>;

type BrowserTransformersModule = {
  env: {
    allowLocalModels?: boolean;
    useBrowserCache?: boolean;
    useWasmCache?: boolean;
  };
  pipeline: PipelineFactory;
};

type BesanjTransformersGlobal = typeof globalThis & {
  __BESANJ_TRANSFORMERS__?: BrowserTransformersModule;
};

let transformersRuntimePromise: Promise<BrowserTransformersModule> | null = null;
let pipelinePromise: Promise<{ pipe: AsrPipeline; backend: "webgpu" | "wasm" }> | null = null;

export function hasWebGpuRuntime() {
  if (typeof navigator === "undefined") return false;
  return "gpu" in (navigator as Navigator & { gpu?: unknown });
}

export function whisperRuntimeAttempts(hasWebGpu: boolean) {
  return hasWebGpu
    ? [
        { backend: "webgpu" as const, options: { device: "webgpu", dtype: "q4" } },
        { backend: "wasm" as const, options: { dtype: "q8" } },
      ]
    : [{ backend: "wasm" as const, options: { dtype: "q8" } }];
}

function normalizeProgressValue(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  if (value <= 1) return Math.max(0, Math.min(100, Math.round(value * 100)));
  return Math.max(0, Math.min(100, Math.round(value)));
}

function modelProgressFromEvent(event: unknown): LocalWhisperProgress {
  if (!event || typeof event !== "object") return { stage: "loading-model" };
  const value = event as { status?: unknown; progress?: unknown; file?: unknown };
  const status = typeof value.status === "string" ? value.status : "";
  const stage: LocalWhisperStage = /progress|download/i.test(status)
    ? "downloading"
    : /ready|done/i.test(status)
      ? "ready"
      : "loading-model";

  return {
    stage,
    progress: normalizeProgressValue(value.progress),
    file: typeof value.file === "string" ? value.file : undefined,
  };
}

function loadedTransformersRuntime() {
  return (globalThis as BesanjTransformersGlobal).__BESANJ_TRANSFORMERS__;
}

export async function loadBrowserTransformersRuntime() {
  const loaded = loadedTransformersRuntime();
  if (loaded) return loaded;
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("موتور گفتار محلی فقط داخل مرورگر اجرا می‌شود.");
  }
  if (transformersRuntimePromise) return transformersRuntimePromise;

  transformersRuntimePromise = new Promise<BrowserTransformersModule>((resolve, reject) => {
    let settled = false;

    const cleanup = () => {
      window.removeEventListener("besanj-transformers-ready", onReady);
      clearTimeout(timer);
    };

    const finish = (runtime: BrowserTransformersModule) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(runtime);
    };

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      cleanup();
      document
        .querySelector<HTMLScriptElement>(`script[data-besanj-transformers-loader="1"]`)
        ?.remove();
      reject(new Error(message));
    };

    const onReady = () => {
      const runtime = loadedTransformersRuntime();
      if (runtime) finish(runtime);
      else fail("موتور گفتار محلی بارگذاری شد اما آماده نیست.");
    };

    const timer = setTimeout(
      () => fail("آماده‌سازی موتور گفتار محلی بیش از حد طول کشید. دوباره تلاش کن."),
      60_000
    );

    window.addEventListener("besanj-transformers-ready", onReady);

    let script = document.querySelector<HTMLScriptElement>(
      `script[data-besanj-transformers-loader="1"]`
    );
    if (!script) {
      script = document.createElement("script");
      script.type = "module";
      script.src = TRANSFORMERS_LOADER_PATH;
      script.dataset.besanjTransformersLoader = "1";
      script.addEventListener(
        "error",
        () => fail("موتور گفتار محلی دریافت نشد. اتصال اینترنت را بررسی کن."),
        { once: true }
      );
      document.head.appendChild(script);
    }

    const runtime = loadedTransformersRuntime();
    if (runtime) {
      finish(runtime);
      return;
    }

  }).catch((error) => {
    transformersRuntimePromise = null;
    throw error;
  });

  return transformersRuntimePromise;
}

async function createPipeline(progress?: ProgressCallback) {
  progress?.({ stage: "loading-library" });
  const transformers = await loadBrowserTransformersRuntime();
  const env = transformers.env;
  env.allowLocalModels = false;
  env.useBrowserCache = true;
  env.useWasmCache = true;

  const factory = transformers.pipeline;
  let lastError: unknown;

  for (const attempt of whisperRuntimeAttempts(hasWebGpuRuntime())) {
    try {
      progress?.({ stage: "loading-model", backend: attempt.backend });
      const pipe = await factory(
        "automatic-speech-recognition",
        LOCAL_WHISPER_MODEL_ID,
        {
          ...attempt.options,
          progress_callback: (event: unknown) => {
            progress?.({ ...modelProgressFromEvent(event), backend: attempt.backend });
          },
        }
      );
      progress?.({ stage: "ready", progress: 100, backend: attempt.backend });
      return { pipe, backend: attempt.backend };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("مدل گفتار محلی آماده نشد.");
}

export async function prepareLocalWhisper(progress?: ProgressCallback) {
  if (!pipelinePromise) {
    pipelinePromise = createPipeline(progress).catch((error) => {
      pipelinePromise = null;
      throw error;
    });
  }
  return pipelinePromise;
}

export function extractWhisperText(output: AsrOutput) {
  if (Array.isArray(output)) {
    return output.map((item) => item?.text?.trim()).filter(Boolean).join(" ").trim();
  }
  return output?.text?.trim() ?? "";
}

export function resampleMonoAudio(
  channels: ArrayLike<Float32Array>,
  sourceSampleRate: number,
  targetSampleRate = LOCAL_WHISPER_SAMPLE_RATE
) {
  if (!Number.isFinite(sourceSampleRate) || sourceSampleRate <= 0) {
    throw new Error("نرخ نمونه‌برداری صدا معتبر نیست.");
  }
  if (!Number.isFinite(targetSampleRate) || targetSampleRate <= 0) {
    throw new Error("نرخ نمونه‌برداری مقصد معتبر نیست.");
  }
  if (!channels.length || !channels[0]?.length) return new Float32Array();

  const length = channels[0].length;
  const mono = new Float32Array(length);
  for (let channelIndex = 0; channelIndex < channels.length; channelIndex += 1) {
    const channel = channels[channelIndex];
    if (!channel || channel.length !== length) continue;
    for (let index = 0; index < length; index += 1) {
      mono[index] += channel[index] / channels.length;
    }
  }

  if (sourceSampleRate === targetSampleRate) return mono;

  const ratio = sourceSampleRate / targetSampleRate;
  const outputLength = Math.max(1, Math.round(mono.length / ratio));
  const output = new Float32Array(outputLength);

  for (let index = 0; index < outputLength; index += 1) {
    const position = index * ratio;
    const left = Math.floor(position);
    const right = Math.min(mono.length - 1, left + 1);
    const fraction = position - left;
    output[index] = mono[left] * (1 - fraction) + mono[right] * fraction;
  }

  return output;
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") return undefined;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  );
}

export function canUseLocalWhisperRecorder() {
  if (typeof navigator === "undefined" || typeof window === "undefined") return false;
  return Boolean(
    typeof navigator.mediaDevices?.getUserMedia === "function" &&
      typeof MediaRecorder !== "undefined" &&
      getAudioContextConstructor()
  );
}

export async function decodeRecordedAudio(blob: Blob) {
  const AudioContextConstructor = getAudioContextConstructor();
  if (!AudioContextConstructor) throw new Error("پردازش صدای مرورگر در دسترس نیست.");
  const context = new AudioContextConstructor();
  try {
    const buffer = await blob.arrayBuffer();
    const decoded = await context.decodeAudioData(buffer.slice(0));
    const channels = Array.from({ length: decoded.numberOfChannels }, (_, index) =>
      decoded.getChannelData(index)
    );
    return resampleMonoAudio(channels, decoded.sampleRate);
  } finally {
    await context.close().catch(() => undefined);
  }
}

export async function transcribeRecordedAudio(blob: Blob, progress?: ProgressCallback) {
  const { pipe, backend } = await prepareLocalWhisper(progress);
  progress?.({ stage: "transcribing", backend });
  const audio = await decodeRecordedAudio(blob);
  if (!audio.length) throw new Error("صدای قابل پردازشی ضبط نشد.");

  const output = await pipe(audio, {
    language: LOCAL_WHISPER_LANGUAGE,
    task: "transcribe",
    return_timestamps: false,
  });
  return extractWhisperText(output);
}
