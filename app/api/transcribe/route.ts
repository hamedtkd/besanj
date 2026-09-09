import { NextResponse } from "next/server";
import {
  GROQ_TRANSCRIPTION_ENDPOINT,
  MAX_CLOUD_AUDIO_BYTES,
  PERSIAN_TRANSCRIPTION_PROMPT,
  cloudTranscriptionErrorMessage,
  isSupportedCloudAudioType,
  normalizeCloudTranscript,
  resolveGroqTranscriptionModel,
} from "@/lib/cloud-transcription";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

function groqApiKey() {
  return process.env.GROQ_API_KEY?.trim() ?? "";
}

export async function GET() {
  return json({
    configured: Boolean(groqApiKey()),
    provider: "groq",
    model: resolveGroqTranscriptionModel(process.env.GROQ_TRANSCRIBE_MODEL),
  });
}

export async function POST(request: Request) {
  const apiKey = groqApiKey();
  if (!apiKey) {
    return json(
      { error: "کلید Groq روی سرور تنظیم نشده است. مقدار GROQ_API_KEY را در .env.local قرار بده و سرور را دوباره اجرا کن." },
      503
    );
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== requestUrl.origin) {
    return json({ error: "درخواست تبدیل صدا فقط از خود بسنج پذیرفته می شود." }, 403);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "فایل صدا دریافت نشد." }, 400);
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return json({ error: "فایل صدا خالی است." }, 400);
  }
  if (audio.size > MAX_CLOUD_AUDIO_BYTES) {
    return json({ error: "فایل صدا بیش از حد بزرگ است. ضبط را کوتاه تر کن." }, 413);
  }
  if (!isSupportedCloudAudioType(audio.type)) {
    return json({ error: "فرمت این فایل صوتی پشتیبانی نمی شود." }, 415);
  }

  const upstream = new FormData();
  const sourceName = typeof File !== "undefined" && audio instanceof File && audio.name ? audio.name : "besanj-voice.webm";
  upstream.append("file", audio, sourceName);
  upstream.append("model", resolveGroqTranscriptionModel(process.env.GROQ_TRANSCRIBE_MODEL));
  upstream.append("language", "fa");
  upstream.append("response_format", "json");
  upstream.append("temperature", "0");
  upstream.append("prompt", PERSIAN_TRANSCRIPTION_PROMPT);

  let response: Response;
  try {
    response = await fetch(GROQ_TRANSCRIPTION_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: upstream,
      cache: "no-store",
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    return json({ error: "ارتباط با سرویس گفتار برقرار نشد. اینترنت را بررسی کن و دوباره تلاش کن." }, 502);
  }

  if (!response.ok) {
    return json({ error: cloudTranscriptionErrorMessage(response.status) }, response.status === 429 ? 429 : 502);
  }

  const payload = (await response.json().catch(() => null)) as unknown;
  const text = normalizeCloudTranscript(payload);
  if (!text) {
    return json({ error: "سرویس گفتار متنی برنگرداند. دوباره کوتاه و واضح بگو." }, 502);
  }

  return json({ text });
}
