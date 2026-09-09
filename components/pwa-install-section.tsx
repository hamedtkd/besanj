"use client";

import { CheckCircle2, Download, Share2, Smartphone } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function PwaInstallSection() {
  const pwa = usePwaInstall();

  return (
    <section className="border-t border-border pt-5">
      <div className="mb-3 flex items-center gap-2">
        <Smartphone className="size-4 text-primary" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="type-card-title">نصب روی دستگاه</h3>
            <HelpHint label="راهنمای نصب روی دستگاه">
              بسنج را مثل یک اپ مستقل روی موبایل یا دسکتاپ باز کن.
            </HelpHint>
            <Badge variant="secondary">قابل نصب</Badge>
          </div>
        </div>
      </div>

      {pwa.installed ? (
        <div className="flex items-center gap-3 rounded-2xl border border-profit/25 bg-profit/[0.07] p-3.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-profit/12 text-profit">
            <CheckCircle2 className="size-5" />
          </span>
          <div>
            <div className="type-label">اپ نصب شده است</div>
            <p className="type-caption mt-0.5 text-muted-foreground">
              می‌توانی آن را از Home Screen یا فهرست برنامه‌های دستگاه باز کنی.
            </p>
          </div>
        </div>
      ) : pwa.canInstall ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/25 bg-primary/[0.06] p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="type-label">نسخه قابل نصب آماده است</div>
            <p className="type-caption mt-0.5 text-muted-foreground">
              بدون App Store نصب می‌شود و در پنجره مستقل اجرا خواهد شد.
            </p>
          </div>
          <Button
            type="button"
            className="shrink-0"
            onClick={() => void pwa.install()}
          >
            <Download />
            نصب بسنج
          </Button>
        </div>
      ) : pwa.isIos ? (
        <div className="rounded-2xl border border-border bg-muted/45 p-3.5">
          <div className="flex gap-3">
            <Share2 className="mt-0.5 size-5 shrink-0 text-primary" />
            <div>
              <div className="type-label">نصب در iPhone و iPad</div>
              <p className="type-caption mt-1 text-muted-foreground">
                صفحه را در Safari باز کن، دکمه اشتراک‌گذاری را بزن و «Add to Home Screen»
                را انتخاب کن.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/45 p-3.5">
          <div className="type-label">نصب از منوی مرورگر</div>
          <p className="type-caption mt-1 text-muted-foreground">
            بعد از انتشار روی HTTPS، در مرورگرهای پشتیبانی‌شده گزینه «Install app» یا
            «نصب برنامه» در نوار آدرس یا منوی مرورگر ظاهر می‌شود.
          </p>
        </div>
      )}
    </section>
  );
}
