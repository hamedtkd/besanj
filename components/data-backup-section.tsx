"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  AlertTriangle,
  Database,
  Download,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createFullBackup,
  readBackupStats,
  replaceWithBackup,
} from "@/lib/backup";
import {
  makeBackupFileName,
  MAX_BACKUP_IMPORT_BYTES,
  parseBesanjBackupText,
  type BesanjBackupFile,
} from "@/lib/backup-format";
import { formatFileSize } from "@/lib/attachments";
import { formatPersianDate } from "@/lib/format";

export function DataBackupSection() {
  const { toast } = useToast();
  const stats = useLiveQuery(() => readBackupStats(), []);
  const [exporting, setExporting] = React.useState(false);
  const [restoring, setRestoring] = React.useState(false);
  const [pendingBackup, setPendingBackup] =
    React.useState<BesanjBackupFile | null>(null);
  const [pendingFileSize, setPendingFileSize] = React.useState(0);
  const [confirmRestore, setConfirmRestore] = React.useState(false);

  async function exportBackup() {
    setExporting(true);
    try {
      const backup = await createFullBackup();
      const text = JSON.stringify(backup);
      const url = URL.createObjectURL(
        new Blob([text], { type: "application/json;charset=utf-8" })
      );
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = makeBackupFileName(backup.exportedAt);
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
      toast("پشتیبان کامل بسنج دانلود شد.");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "ساخت فایل پشتیبان انجام نشد.",
        "error"
      );
    } finally {
      setExporting(false);
    }
  }

  async function inspectBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    setConfirmRestore(false);

    if (!file) return;
    if (file.size > MAX_BACKUP_IMPORT_BYTES) {
      setPendingBackup(null);
      setPendingFileSize(0);
      toast("فایل پشتیبان بیش از ۱۲۸ مگابایت است.", "error");
      return;
    }

    try {
      const parsed = parseBesanjBackupText(await file.text());
      setPendingBackup(parsed);
      setPendingFileSize(file.size);
      toast("فایل پشتیبان بررسی شد؛ قبل از بازیابی خلاصه را چک کن.");
    } catch (error) {
      setPendingBackup(null);
      setPendingFileSize(0);
      toast(
        error instanceof Error ? error.message : "فایل پشتیبان قابل خواندن نیست.",
        "error"
      );
    }
  }

  async function restoreBackup() {
    if (!pendingBackup) return;
    setRestoring(true);
    try {
      await replaceWithBackup(pendingBackup);
      toast("بازیابی کامل شد. بسنج دوباره بارگذاری می‌شود.");
      window.setTimeout(() => window.location.reload(), 450);
    } catch (error) {
      setRestoring(false);
      toast(
        error instanceof Error ? error.message : "بازیابی پشتیبان انجام نشد.",
        "error"
      );
    }
  }

  const hasData =
    Boolean(stats) &&
    ((stats?.cases ?? 0) +
      (stats?.quotes ?? 0) +
      (stats?.reminders ?? 0) +
      (stats?.attachments ?? 0) +
      (stats?.budgetPlans ?? 0) >
      0);

  return (
    <section className="border-t border-border pt-5">
      <div className="mb-3 flex items-start gap-2">
        <Database className="mt-0.5 size-4 text-primary" />
        <div>
          <h3 className="type-card-title">پشتیبان و انتقال داده</h3>
          <p className="type-caption mt-0.5 text-muted-foreground">
            پرونده‌ها، دسته‌ها، برچسب‌ها، بودجه‌ها، استعلام‌ها، پیگیری‌ها، پیوست‌ها و تنظیمات ظاهری را در یک
            فایل نگه دار یا روی دستگاه دیگری بازیابی کن.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="type-label">داده فعلی این مرورگر</div>
            {stats ? (
              <p className="type-caption mt-1 text-muted-foreground">
                {stats.cases.toLocaleString("fa-IR")} پرونده ·{" "}
                {stats.quotes.toLocaleString("fa-IR")} استعلام ·{" "}
                {stats.reminders.toLocaleString("fa-IR")} پیگیری ·{" "}
                {stats.attachments.toLocaleString("fa-IR")} پیوست
                {stats.budgetPlans ? " · بودجه ماهانه تنظیم شده" : ""}
                {stats.attachmentBytes
                  ? ` · ${formatFileSize(stats.attachmentBytes)} فایل`
                  : ""}
              </p>
            ) : (
              <p className="type-caption mt-1 text-muted-foreground">
                در حال خواندن اطلاعات محلی…
              </p>
            )}
          </div>
          <Badge variant={hasData ? "success" : "secondary"}>
            {hasData ? "آماده پشتیبان" : "بدون داده"}
          </Badge>
        </div>

        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full sm:w-auto"
          loading={exporting}
          onClick={() => void exportBackup()}
        >
          <Download />
          دانلود پشتیبان کامل
        </Button>
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-background/55 p-3.5">
        <div className="flex items-center gap-2">
          <Upload className="size-4 text-primary" />
          <div className="type-label">بازیابی از فایل</div>
        </div>
        <p className="type-caption mt-1 text-muted-foreground">
          ابتدا فایل را انتخاب کن. تا وقتی تأیید نهایی نکنی، هیچ داده‌ای تغییر
          نمی‌کند.
        </p>

        <Input
          type="file"
          accept=".json,application/json"
          className="mt-3 h-auto min-h-10 py-1.5 file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary"
          onChange={(event) => void inspectBackup(event)}
        />

        {pendingBackup ? (
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/[0.05] p-3">
            <div className="flex items-center gap-2 text-primary">
              <ShieldCheck className="size-4" />
              <span className="type-label">فایل معتبر بسنج</span>
            </div>
            <div className="type-caption mt-2 grid gap-1 text-muted-foreground sm:grid-cols-2">
              <span>
                تاریخ پشتیبان: {formatPersianDate(pendingBackup.exportedAt)}
              </span>
              <span>نسخه برنامه: {pendingBackup.appVersion}</span>
              <span>
                {pendingBackup.stats.cases.toLocaleString("fa-IR")} پرونده ·{" "}
                {pendingBackup.stats.quotes.toLocaleString("fa-IR")} استعلام
              </span>
              <span>
                {pendingBackup.stats.attachments.toLocaleString("fa-IR")} پیوست ·{" "}
                {formatFileSize(pendingBackup.stats.attachmentBytes)}
              </span>
              <span>حجم فایل: {formatFileSize(pendingFileSize)}</span>
            </div>

            {!confirmRestore ? (
              <Button
                type="button"
                variant="destructive"
                className="mt-3"
                onClick={() => setConfirmRestore(true)}
              >
                آماده بازیابی و جایگزینی
              </Button>
            ) : (
              <div className="mt-3 rounded-xl border border-destructive/25 bg-destructive/[0.06] p-3">
                <div className="flex items-start gap-2 text-destructive">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p className="type-caption">
                    داده فعلی این مرورگر با محتوای فایل جایگزین می‌شود. اگر
                    اطلاعات فعلی لازم است، اول یک پشتیبان از آن دانلود کن.
                  </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="destructive"
                    loading={restoring}
                    onClick={() => void restoreBackup()}
                  >
                    بله، بازیابی کن
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={restoring}
                    onClick={() => setConfirmRestore(false)}
                  >
                    انصراف
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
