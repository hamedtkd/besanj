"use client";

import { BellOff, BellRing, CircleAlert, FlaskConical, Smartphone } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { useNotifications } from "@/components/notification-provider";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const notificationKinds = [
  {
    key: "reminders" as const,
    label: "پیگیری‌های سررسیدشده",
    description: "امروز، فردا و موارد عقب‌افتاده",
  },
  {
    key: "expiring" as const,
    label: "قیمت‌های رو به انقضا",
    description: "هشدار اعتبار قیمت امروز یا فردا",
  },
  {
    key: "delivery" as const,
    label: "موعد تحویل خرید",
    description: "امروز، فردا و تحویل‌های عقب‌افتاده",
  },
  {
    key: "stale" as const,
    label: "قیمت‌های قدیمی",
    description: "برای پرونده‌هایی که نیاز به استعلام تازه دارند",
  },
  {
    key: "ready" as const,
    label: "آماده تصمیم",
    description: "وقتی چند گزینه تازه برای مقایسه داری",
  },
];

export function NotificationSettingsSection() {
  const notifications = useNotifications();
  const { toast } = useToast();
  const active = notifications.settings.enabled && notifications.permission === "granted";

  async function enable() {
    const outcome = await notifications.enable();
    if (outcome === "enabled") {
      toast("اعلان‌های بسنج فعال شد.");
      return;
    }
    if (outcome === "denied") {
      toast("مجوز اعلان در مرورگر مسدود است؛ از تنظیمات سایت آن را فعال کن.", "error");
      return;
    }
    toast("این مرورگر اعلان وب را پشتیبانی نمی‌کند.", "error");
  }

  async function testNotification() {
    const shown = await notifications.sendTest();
    toast(shown ? "اعلان آزمایشی ارسال شد." : "ارسال اعلان آزمایشی ممکن نبود.", shown ? "success" : "error");
  }

  return (
    <section className="border-t border-border pt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <BellRing className="size-4 shrink-0 text-primary" />
          <div className="flex items-center gap-1.5">
            <h3 className="type-card-title">اعلان و پیگیری هوشمند</h3>
            <HelpHint label="راهنمای اعلان‌ها">
              کارهای مهم را هنگام باز بودن یا برگشتن به بسنج یادآوری کن.
            </HelpHint>
          </div>
        </div>
        <Badge variant={active ? "success" : "secondary"}>
          {active ? "فعال" : notifications.permission === "denied" ? "مسدود" : "خاموش"}
        </Badge>
      </div>

      <div className="rounded-2xl border border-border bg-muted/25 p-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              {active ? <BellRing className="size-4" /> : <BellOff className="size-4" />}
            </span>
            <div className="flex items-center gap-1.5">
              <div className="type-label">اعلان سیستم‌عامل</div>
              <HelpHint label="راهنمای اعلان سیستم‌عامل">
                {active
                  ? "بسنج موارد جدید را یک‌بار در هر روز اعلان می‌کند و شمار کارها را روی آیکن اپ نگه می‌دارد."
                  : "برای دریافت هشدار باید یک‌بار اجازه اعلان را به بسنج بدهی."}
              </HelpHint>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {active ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => void testNotification()}>
                  <FlaskConical />
                  تست
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={notifications.disable}>
                  خاموش کردن
                </Button>
              </>
            ) : (
              <Button type="button" size="sm" onClick={() => void enable()}>
                <BellRing />
                فعال‌سازی اعلان
              </Button>
            )}
          </div>
        </div>

        {active ? (
          <div className="mt-4 grid gap-2 border-t border-border/75 pt-3 sm:grid-cols-2">
            {notificationKinds.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/75 bg-background/55 p-3"
              >
                <Checkbox
                  checked={notifications.settings[item.key]}
                  onCheckedChange={(checked) => notifications.setKindEnabled(item.key, checked === true)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1">
                    <span className="type-label block">{item.label}</span>
                    <HelpHint label={`راهنمای ${item.label}`}>{item.description}</HelpHint>
                  </span>
                </span>
              </label>
            ))}

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border/75 bg-background/55 p-3 sm:col-span-2">
              <Checkbox
                checked={notifications.settings.appBadge}
                onCheckedChange={(checked) => notifications.setKindEnabled("appBadge", checked === true)}
              />
              <span className="min-w-0 flex-1">
                <span className="type-label flex items-center gap-1.5">
                  <Smartphone className="size-3.5 text-primary" />
                  نشان تعداد کارها روی آیکن اپ
                  <HelpHint label="راهنمای نشان آیکن اپ">
                    در مرورگرها و سیستم‌عامل‌هایی که App Badge را پشتیبانی می‌کنند.
                  </HelpHint>
                </span>
              </span>
            </label>
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-3 py-2.5 text-amber-800 dark:text-amber-200">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <p className="type-caption">
          بسنج هنوز Backend/Push Server ندارد؛ بنابراین وقتی مرورگر و PWA کاملاً بسته‌اند، تحویل تضمین‌شده در ساعت مشخص ممکن نیست. اعلان‌ها هنگام اجرای اپ، بازگشت به آن و تغییر کارها بررسی می‌شوند.
        </p>
      </div>
    </section>
  );
}
