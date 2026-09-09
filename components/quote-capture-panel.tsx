"use client";

import * as React from "react";
import { CircleAlert, Clipboard, Sparkles } from "lucide-react";
import { LocalVoiceCapture } from "@/components/local-voice-capture";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { parseQuoteCapture, type QuoteCaptureDraft } from "@/lib/quote-capture";

export function QuoteCapturePanel({
  onApply,
}: {
  onApply: (draft: QuoteCaptureDraft, sourceText: string) => void;
}) {
  const [text, setText] = React.useState("");
  const [lastDraft, setLastDraft] = React.useState<QuoteCaptureDraft | null>(null);

  function parseAndApply() {
    const draft = parseQuoteCapture(text);
    setLastDraft(draft);
    onApply(draft, text.trim());
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-primary/20 bg-primary/[0.045]">
      <div className="flex items-start gap-3 border-b border-primary/15 px-3.5 py-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Clipboard className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="type-label">ثبت سریع از متن</div>
          <p className="type-caption mt-0.5 text-muted-foreground">
            متن پیام، پیش‌فاکتور یا یادداشت فروشنده را بچسبان. بسنج فقط فیلدهای قابل تشخیص را پیشنهاد می‌دهد و چیزی خودکار ثبت نمی‌شود.
          </p>
        </div>
      </div>

      <div className="grid gap-3 p-3.5">
        <Textarea
          value={text}
          onChange={(event) => setText(event.currentTarget.value)}
          dir="auto"
          className="min-h-28 bg-background/70"
          placeholder={"مثلاً:\nفروشگاه آریا\nقیمت: ۶۸,۵۰۰,۰۰۰ تومان\nموبایل: ۰۹۱۲۱۲۳۴۵۶۷\nتحویل ۳ روز\nگارانتی: ۱۸ ماه شرکتی\nاعتبار ۲ روز"}
        />

        <LocalVoiceCapture
          onTranscript={(transcript) =>
            setText((current) => [current.trim(), transcript.trim()].filter(Boolean).join("\n"))
          }
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="type-caption text-muted-foreground">
            قیمت و اطلاعات پیشنهادی را بعد از پرشدن فرم بررسی کن.
          </span>
          <Button
            type="button"
            size="sm"
            onClick={parseAndApply}
            disabled={!text.trim()}
          >
            <Sparkles />
            پر کردن فرم
          </Button>
        </div>

        {lastDraft ? (
          <div className="grid gap-2 rounded-xl border border-border/75 bg-background/65 p-3">
            {lastDraft.detectedFields.length ? (
              <div className="flex flex-wrap gap-1.5">
                {lastDraft.detectedFields.map((field) => (
                  <span
                    key={field}
                    className="rounded-lg bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300"
                  >
                    {field}
                  </span>
                ))}
              </div>
            ) : (
              <span className="type-caption text-muted-foreground">
                فیلد مشخصی پیدا نشد؛ متن را نگه دار و اطلاعات را دستی وارد کن.
              </span>
            )}

            {lastDraft.warnings.map((warning) => (
              <div key={warning} className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                <span className="type-caption">{warning}</span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
