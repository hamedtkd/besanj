"use client";

import * as React from "react";
import { Download, Mic, ShieldCheck, Sparkles, Square } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { Button } from "@/components/ui/button";
import {
  createLocalSpeechRecognition,
  installLocalSpeechPack,
  localSpeechAvailability,
  transcriptFromSpeechEvent,
  type LocalSpeechAvailability,
  type LocalSpeechRecognitionLike,
} from "@/lib/local-speech";
import {
  canUseLocalWhisperRecorder,
  prepareLocalWhisper,
  transcribeRecordedAudio,
  type LocalWhisperProgress,
} from "@/lib/local-whisper";
import {
  CLOUD_TRANSCRIPTION_ROUTE,
  transcribeCloudAudio,
} from "@/lib/cloud-transcription";
import { toPersianDigits } from "@/lib/persian-number";

const MAX_RECORDING_MS = 45_000;

type VoiceEngine = "cloud" | "native" | "whisper" | null;
type CloudStatus = "checking" | "ready" | "missing" | "unknown";

function preferredAudioMimeType() {
  if (typeof MediaRecorder === "undefined" || !MediaRecorder.isTypeSupported) return undefined;
  return [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType));
}

function canRecordAudio() {
  if (typeof navigator === "undefined" || typeof MediaRecorder === "undefined") return false;
  return typeof navigator.mediaDevices?.getUserMedia === "function";
}

function whisperProgressMessage(progress: LocalWhisperProgress) {
  if (progress.stage === "transcribing") {
    return "در حال تبدیل صدا به متن روی همین دستگاه...";
  }
  if (progress.stage === "ready") {
    return progress.backend === "webgpu"
      ? "مدل گفتار محلی آماده است و با شتاب سخت افزاری اجرا می شود."
      : "مدل گفتار محلی آماده است و روی پردازنده دستگاه اجرا می شود.";
  }
  if (progress.stage === "downloading" && progress.progress !== undefined) {
    return `در حال دریافت مدل گفتار برای استفاده محلی، ${toPersianDigits(String(progress.progress))}٪`;
  }
  if (progress.stage === "loading-library") {
    return "در حال آماده سازی موتور گفتار محلی...";
  }
  return "در حال آماده سازی مدل گفتار محلی؛ بار اول ممکن است کمی زمان ببرد.";
}

export function LocalVoiceCapture({
  onTranscript,
  disabled = false,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const recognitionRef = React.useRef<LocalSpeechRecognitionLike | null>(null);
  const recorderRef = React.useRef<MediaRecorder | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<BlobPart[]>([]);
  const recordingTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = React.useRef(true);

  const [availability, setAvailability] = React.useState<LocalSpeechAvailability | "idle">("idle");
  const [cloudStatus, setCloudStatus] = React.useState<CloudStatus>("checking");
  const [engine, setEngine] = React.useState<VoiceEngine>(null);
  const [listening, setListening] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [whisperProgress, setWhisperProgress] = React.useState<LocalWhisperProgress | null>(null);

  function clearRecordingTimer() {
    if (recordingTimerRef.current) {
      clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  }

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  React.useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();

    void fetch(CLOUD_TRANSCRIPTION_ROUTE, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("status");
        const payload = (await response.json()) as { configured?: unknown };
        if (!mountedRef.current) return;
        setCloudStatus(payload.configured === true ? "ready" : "missing");
      })
      .catch(() => {
        if (mountedRef.current && !controller.signal.aborted) setCloudStatus("unknown");
      });

    return () => {
      mountedRef.current = false;
      controller.abort();
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
      clearRecordingTimer();
      const recorder = recorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        recorder.onerror = null;
        recorder.ondataavailable = null;
        if (recorder.state !== "inactive") recorder.stop();
      }
      recorderRef.current = null;
      stopStream();
    };
  }, []);

  function setWhisperStatus(progress: LocalWhisperProgress) {
    if (!mountedRef.current) return;
    setWhisperProgress(progress);
    setMessage(whisperProgressMessage(progress));
  }

  function startNativeListening() {
    const recognition = createLocalSpeechRecognition("fa-IR");
    if (!recognition) {
      void startWhisperFallback();
      return;
    }

    recognition.onresult = (event) => {
      const text = transcriptFromSpeechEvent(event);
      if (text) onTranscript(text);
    };
    recognition.onerror = (event) => {
      setListening(false);
      setEngine(null);
      if (event.error === "not-allowed") {
        setMessage("دسترسی میکروفن داده نشد.");
      } else if (event.error === "language-not-supported") {
        setMessage("بسته گفتار فارسی مرورگر آماده نیست؛ می توانی مدل محلی بسنج را امتحان کنی.");
      } else {
        setMessage("تشخیص محلی صدا انجام نشد. دوباره تلاش کن یا از حالت هوش مصنوعی استفاده کن.");
      }
    };
    recognition.onend = () => {
      setListening(false);
      setEngine(null);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setMessage("تشخیص محلی فعال است؛ اطلاعات را طبیعی و پیوسته بگو.");
    setEngine("native");
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      setEngine(null);
      recognitionRef.current = null;
      setMessage("میکروفن شروع نشد. دوباره تلاش کن.");
    }
  }

  async function finishWhisperRecording(blob: Blob) {
    if (!mountedRef.current) return;
    setBusy(true);
    setListening(false);
    setEngine(null);
    setMessage("در حال تبدیل صدا به متن روی همین دستگاه...");
    try {
      const transcript = await transcribeRecordedAudio(blob, setWhisperStatus);
      if (!mountedRef.current) return;
      if (!transcript) {
        setMessage("متنی از صدا تشخیص داده نشد. دوباره کوتاه و واضح بگو.");
        return;
      }
      onTranscript(transcript);
      setMessage("متن محلی آماده شد؛ نتیجه استخراج شده را قبل از ثبت بررسی کن.");
    } catch (error) {
      if (!mountedRef.current) return;
      setMessage(error instanceof Error ? error.message : "تبدیل محلی صدا به متن انجام نشد.");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  async function finishCloudRecording(blob: Blob) {
    if (!mountedRef.current) return;
    setBusy(true);
    setListening(false);
    setEngine(null);
    setMessage("در حال تبدیل دقیق تر صدا به متن با هوش مصنوعی...");
    try {
      const transcript = await transcribeCloudAudio(blob);
      if (!mountedRef.current) return;
      onTranscript(transcript);
      setMessage("متن صدا آماده شد؛ نتیجه استخراج شده را قبل از ثبت بررسی کن.");
    } catch (error) {
      if (!mountedRef.current) return;
      setMessage(error instanceof Error ? error.message : "تبدیل صدا به متن انجام نشد.");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  async function beginRecordedCapture(target: "cloud" | "whisper") {
    if (target === "cloud" ? !canRecordAudio() : !canUseLocalWhisperRecorder()) {
      setMessage("این مرورگر امکان ضبط صدا را ندارد. ورود متنی و Paste همچنان فعال است.");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
    } catch {
      setMessage("دسترسی میکروفن داده نشد یا میکروفن در دسترس نیست.");
      return;
    }

    const mimeType = preferredAudioMimeType();
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setMessage("فرمت ضبط صدای این مرورگر پشتیبانی نشد.");
      return;
    }

    streamRef.current = stream;
    recorderRef.current = recorder;
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      clearRecordingTimer();
      stopStream();
      recorderRef.current = null;
      setListening(false);
      setEngine(null);
      setMessage("ضبط صدا با خطا متوقف شد.");
    };
    recorder.onstop = () => {
      clearRecordingTimer();
      const blob = new Blob(chunksRef.current, {
        type: recorder.mimeType || mimeType || "audio/webm",
      });
      chunksRef.current = [];
      recorderRef.current = null;
      stopStream();
      if (target === "cloud") void finishCloudRecording(blob);
      else void finishWhisperRecording(blob);
    };

    recorder.start(250);
    setEngine(target);
    setListening(true);
    setMessage(
      target === "cloud"
        ? "در حال ضبط برای تشخیص دقیق تر؛ جمله را طبیعی بگو و سپس «پایان گفتن» را بزن."
        : "در حال ضبط با مدل محلی بسنج؛ جمله را طبیعی بگو و سپس «پایان گفتن» را بزن."
    );
    recordingTimerRef.current = setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, MAX_RECORDING_MS);
  }

  async function startCloudCapture() {
    if (listening) {
      stopListening();
      return;
    }
    if (busy) return;
    if (cloudStatus === "missing") {
      setMessage("کلید Groq تنظیم نشده است. GROQ_API_KEY را در .env.local بگذار و dev server را دوباره اجرا کن.");
      return;
    }
    await beginRecordedCapture("cloud");
  }

  async function startWhisperFallback() {
    if (listening || busy) return;
    if (!canUseLocalWhisperRecorder()) {
      setMessage("این مرورگر امکان ضبط و پردازش صدای محلی را ندارد. ورود متنی و Paste همچنان فعال است.");
      return;
    }

    setBusy(true);
    setWhisperProgress(null);
    setMessage("در حال آماده سازی مدل گفتار محلی؛ بار اول فایل عمومی مدل از اینترنت دریافت می شود.");
    try {
      await prepareLocalWhisper(setWhisperStatus);
      if (!mountedRef.current) return;
      setBusy(false);
      await beginRecordedCapture("whisper");
    } catch (error) {
      if (!mountedRef.current) return;
      setBusy(false);
      setMessage(
        error instanceof Error
          ? `مدل گفتار محلی آماده نشد: ${error.message}`
          : "مدل گفتار محلی آماده نشد. اتصال اینترنت را برای دریافت اولیه بررسی کن."
      );
    }
  }

  function stopListening() {
    if (engine === "native") {
      recognitionRef.current?.stop();
      return;
    }
    if (engine === "cloud" || engine === "whisper") {
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
    }
  }

  async function prepareLocalAndStart() {
    if (listening) {
      stopListening();
      return;
    }
    if (busy) return;

    setBusy(true);
    setMessage(null);
    const next = await localSpeechAvailability("fa-IR");
    if (!mountedRef.current) return;
    setAvailability(next);
    setBusy(false);

    if (next === "available") {
      startNativeListening();
      return;
    }
    if (next === "downloadable" || next === "downloading") {
      setMessage("مرورگر می تواند بسته گفتار فارسی را نصب کند. یا مدل محلی بسنج را امتحان کن.");
      return;
    }

    await startWhisperFallback();
  }

  async function installPack() {
    setBusy(true);
    setMessage("در حال آماده سازی بسته گفتار فارسی مرورگر...");
    const installed = await installLocalSpeechPack("fa-IR");
    if (!mountedRef.current) return;
    setBusy(false);
    if (!installed) {
      setAvailability("unavailable");
      setMessage("بسته گفتار فارسی مرورگر نصب نشد؛ مدل محلی بسنج همچنان قابل استفاده است.");
      return;
    }
    setAvailability("available");
    setMessage("بسته گفتار فارسی مرورگر آماده شد.");
    startNativeListening();
  }

  const showWhisperButton =
    availability === "downloadable" ||
    availability === "downloading" ||
    availability === "unavailable" ||
    availability === "unsupported";

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={listening && engine === "cloud" ? "destructive" : "outline"}
          onClick={startCloudCapture}
          disabled={disabled || busy || (listening && engine !== "cloud")}
        >
          {listening && engine === "cloud" ? <Square /> : <Sparkles />}
          {busy && engine !== "whisper"
            ? "در حال پردازش..."
            : listening && engine === "cloud"
              ? "پایان گفتن"
              : "با هوش مصنوعی بگو"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant={listening && (engine === "native" || engine === "whisper") ? "destructive" : "outline"}
          onClick={prepareLocalAndStart}
          disabled={disabled || busy || (listening && engine === "cloud")}
        >
          {listening && (engine === "native" || engine === "whisper") ? <Square /> : <ShieldCheck />}
          {listening && (engine === "native" || engine === "whisper") ? "پایان گفتن" : "تشخیص محلی"}
        </Button>

        {availability === "downloadable" || availability === "downloading" ? (
          <Button type="button" size="sm" variant="outline" onClick={installPack} disabled={busy || listening}>
            <Download />
            نصب گفتار فارسی
          </Button>
        ) : null}

        {showWhisperButton && !listening ? (
          <Button type="button" size="sm" variant="outline" onClick={startWhisperFallback} disabled={busy || disabled}>
            <Mic />
            مدل محلی بسنج
          </Button>
        ) : null}

        <HelpHint label="راهنمای تشخیص صدا" side="bottom">
          حالت هوش مصنوعی فقط صدای همین ضبط را برای تبدیل به متن به Groq می‌فرستد و کلید API داخل مرورگر قرار نمی‌گیرد. «تشخیص محلی» و «مدل محلی بسنج» صدا را روی دستگاه پردازش می‌کنند. در همه حالت‌ها متن قبل از ثبت نمایش داده می‌شود.
        </HelpHint>
      </div>

      {whisperProgress?.stage === "downloading" && whisperProgress.progress !== undefined ? (
        <div
          className="h-1.5 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="دریافت مدل گفتار محلی"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={whisperProgress.progress}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${whisperProgress.progress}%` }}
          />
        </div>
      ) : null}

      {cloudStatus === "missing" && !message ? (
        <p className="type-caption text-muted-foreground">
          برای حالت هوش مصنوعی، کلید Groq هنوز روی سرور تنظیم نشده است.
        </p>
      ) : null}
      {message ? <p className="type-caption text-muted-foreground">{message}</p> : null}

    </div>
  );
}
