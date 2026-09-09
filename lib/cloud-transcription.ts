export const CLOUD_TRANSCRIPTION_ROUTE = "/api/transcribe";
export const GROQ_TRANSCRIPTION_ENDPOINT = "https://api.groq.com/openai/v1/audio/transcriptions";
export const DEFAULT_GROQ_TRANSCRIPTION_MODEL = "whisper-large-v3";
export const GROQ_TRANSCRIPTION_MODELS = [
  "whisper-large-v3",
  "whisper-large-v3-turbo",
] as const;
export const MAX_CLOUD_AUDIO_BYTES = 10 * 1024 * 1024;

export const PERSIAN_TRANSCRIPTION_PROMPT =
  "این صدا فارسی و مربوط به استعلام خرید است. نام برند و مدل، حروف و عدد لاتین، قیمت به تومان، گارانتی، موجودی، زمان تحویل و شماره تلفن را دقیق و بدون خلاصه سازی رونویسی کن.";

export type GroqTranscriptionModel = (typeof GROQ_TRANSCRIPTION_MODELS)[number];

export function resolveGroqTranscriptionModel(value?: string | null): GroqTranscriptionModel {
  const normalized = value?.trim();
  return GROQ_TRANSCRIPTION_MODELS.includes(normalized as GroqTranscriptionModel)
    ? (normalized as GroqTranscriptionModel)
    : DEFAULT_GROQ_TRANSCRIPTION_MODEL;
}

export function isSupportedCloudAudioType(type: string) {
  const normalized = type.trim().toLowerCase();
  if (!normalized) return true;
  return (
    normalized.startsWith("audio/webm") ||
    normalized.startsWith("audio/ogg") ||
    normalized.startsWith("audio/mp4") ||
    normalized.startsWith("audio/mpeg") ||
    normalized.startsWith("audio/wav") ||
    normalized.startsWith("audio/x-wav") ||
    normalized.startsWith("audio/m4a") ||
    normalized.startsWith("audio/x-m4a")
  );
}

export function normalizeCloudTranscript(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const text = (value as { text?: unknown }).text;
  return typeof text === "string" ? text.trim() : "";
}

export function cloudTranscriptionErrorMessage(status: number) {
  if (status === 401 || status === 403) {
    return "کلید Groq معتبر نیست یا اجازه استفاده از مدل گفتار را ندارد.";
  }
  if (status === 413) {
    return "فایل صدا برای تبدیل ابری بیش از حد بزرگ است.";
  }
  if (status === 429) {
    return "سقف استفاده از سرویس گفتار فعلاً پر شده است. کمی بعد دوباره تلاش کن.";
  }
  if (status >= 500) {
    return "سرویس تبدیل گفتار موقتاً در دسترس نیست. دوباره تلاش کن یا از تشخیص محلی استفاده کن.";
  }
  return "تبدیل صدا به متن انجام نشد. دوباره تلاش کن.";
}

function audioFileName(type: string) {
  const normalized = type.toLowerCase();
  if (normalized.includes("ogg")) return "besanj-voice.ogg";
  if (normalized.includes("mp4") || normalized.includes("m4a")) return "besanj-voice.m4a";
  if (normalized.includes("mpeg")) return "besanj-voice.mp3";
  if (normalized.includes("wav")) return "besanj-voice.wav";
  return "besanj-voice.webm";
}

export async function transcribeCloudAudio(blob: Blob) {
  if (!blob.size) throw new Error("صدایی برای تبدیل ثبت نشد.");
  if (blob.size > MAX_CLOUD_AUDIO_BYTES) {
    throw new Error("ضبط صدا بیش از حد بزرگ است. کوتاه تر بگو و دوباره تلاش کن.");
  }

  const form = new FormData();
  form.append("audio", blob, audioFileName(blob.type));

  let response: Response;
  try {
    response = await fetch(CLOUD_TRANSCRIPTION_ROUTE, {
      method: "POST",
      body: form,
      cache: "no-store",
    });
  } catch {
    throw new Error("ارتباط با سرویس گفتار برقرار نشد. اینترنت را بررسی کن یا از تشخیص محلی استفاده کن.");
  }

  const payload = (await response.json().catch(() => null)) as
    | { text?: unknown; error?: unknown }
    | null;

  if (!response.ok) {
    const error = payload && typeof payload.error === "string" ? payload.error.trim() : "";
    throw new Error(error || cloudTranscriptionErrorMessage(response.status));
  }

  const text = normalizeCloudTranscript(payload);
  if (!text) throw new Error("متنی از صدا تشخیص داده نشد. دوباره کوتاه و واضح بگو.");
  return text;
}
