"use client";

import * as React from "react";
import { Download, Mic, MicOff, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createLocalSpeechRecognition,
  installLocalSpeechPack,
  localSpeechAvailability,
  transcriptFromSpeechEvent,
  type LocalSpeechAvailability,
  type LocalSpeechRecognitionLike,
} from "@/lib/local-speech";

export function LocalVoiceCapture({
  onTranscript,
  disabled = false,
}: {
  onTranscript: (text: string) => void;
  disabled?: boolean;
}) {
  const recognitionRef = React.useRef<LocalSpeechRecognitionLike | null>(null);
  const [availability, setAvailability] = React.useState<LocalSpeechAvailability | "idle">("idle");
  const [listening, setListening] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    return () => {
      recognitionRef.current?.abort?.();
      recognitionRef.current = null;
    };
  }, []);

  function startListening() {
    const recognition = createLocalSpeechRecognition("fa-IR");
    if (!recognition) {
      setAvailability("unsupported");
      setMessage("این مرورگر تشخیص گفتار محلی را پشتیبانی نمی‌کند.");
      return;
    }

    recognition.onresult = (event) => {
      const text = transcriptFromSpeechEvent(event);
      if (text) onTranscript(text);
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (event.error === "not-allowed") {
        setMessage("دسترسی میکروفن داده نشد.");
      } else if (event.error === "language-not-supported") {
        setMessage("بسته گفتار فارسی روی دستگاه آماده نیست.");
      } else {
        setMessage("تشخیص صدا انجام نشد. دوباره تلاش کن.");
      }
    };
    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setMessage("در حال گوش دادن، اطلاعات را طبیعی و پیوسته بگو.");
    setListening(true);
    try {
      recognition.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
      setMessage("میکروفن شروع نشد. دوباره تلاش کن.");
    }
  }

  async function prepareAndStart() {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }

    setBusy(true);
    setMessage(null);
    const next = await localSpeechAvailability("fa-IR");
    setAvailability(next);
    setBusy(false);

    if (next === "available") {
      startListening();
      return;
    }
    if (next === "downloadable" || next === "downloading") {
      setMessage("برای تشخیص صدا روی خود دستگاه، بسته گفتار فارسی باید نصب شود.");
      return;
    }
    if (next === "unsupported") {
      setMessage("این مرورگر تشخیص گفتار محلی را ندارد. ثبت متنی و Paste همچنان در دسترس است.");
      return;
    }
    setMessage("تشخیص گفتار فارسی روی خود این دستگاه در دسترس نیست.");
  }

  async function installPack() {
    setBusy(true);
    setMessage("در حال آماده‌سازی بسته گفتار فارسی روی دستگاه...");
    const installed = await installLocalSpeechPack("fa-IR");
    setBusy(false);
    if (!installed) {
      setAvailability("unavailable");
      setMessage("بسته گفتار فارسی نصب نشد. می‌توانی از ورود متنی استفاده کنی.");
      return;
    }
    setAvailability("available");
    setMessage("بسته گفتار فارسی آماده شد.");
    startListening();
  }

  return (
    <div className="grid gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={listening ? "destructive" : "outline"}
          onClick={prepareAndStart}
          disabled={disabled || busy}
        >
          {listening ? <Square /> : availability === "unsupported" || availability === "unavailable" ? <MicOff /> : <Mic />}
          {busy ? "در حال بررسی..." : listening ? "پایان گفتن" : "با صدا بگو"}
        </Button>

        {(availability === "downloadable" || availability === "downloading") ? (
          <Button type="button" size="sm" variant="outline" onClick={installPack} disabled={busy}>
            <Download />
            نصب گفتار فارسی
          </Button>
        ) : null}
      </div>
      {message ? <p className="type-caption text-muted-foreground">{message}</p> : null}
      <p className="type-caption text-muted-foreground">
        صدا فقط وقتی استفاده می‌شود که مرورگر پردازش روی خود دستگاه را پشتیبانی کند؛ بسنج برای این قابلیت به سرویس ابری fallback نمی‌کند.
      </p>
    </div>
  );
}
