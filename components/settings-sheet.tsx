"use client";

import * as React from "react";
import { Check, Monitor, Moon, Palette, Settings2, Sun, WandSparkles } from "lucide-react";
import { useAppTheme } from "@/components/app-theme";
import {
  useAppPreferences,
  type AppPalette,
} from "@/components/app-preferences";
import { CustomThemeColorSheet } from "@/components/custom-theme-color-sheet";
import { DataBackupSection } from "@/components/data-backup-section";
import { PwaInstallSection } from "@/components/pwa-install-section";
import { NotificationSettingsSection } from "@/components/notification-settings-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { cn } from "@/lib/utils";

const APPEARANCE_OPTIONS = [
  {
    value: "system",
    label: "سیستم",
    description: "مطابق تنظیم دستگاه",
    icon: Monitor,
  },
  {
    value: "light",
    label: "روشن",
    description: "همیشه روشن",
    icon: Sun,
  },
  {
    value: "dark",
    label: "تاریک",
    description: "همیشه تاریک",
    icon: Moon,
  },
] as const;

const PALETTE_OPTIONS: Array<{
  value: Exclude<AppPalette, "custom">;
  label: string;
  css: string;
}> = [
  { value: "blue", label: "آبی برند", css: "#2563eb" },
  { value: "violet", label: "بنفش", css: "#7c3aed" },
  { value: "amber", label: "کهربایی", css: "#9a6f0a" },
  { value: "rose", label: "رز", css: "#db2777" },
];

export function SettingsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { theme, setTheme } = useAppTheme();
  const preferences = useAppPreferences();
  const [customOpen, setCustomOpen] = React.useState(false);
  const currentTheme = theme;

  return (
    <>
      <ResponsiveSheet
        open={open}
        onOpenChange={onOpenChange}
        title="تنظیمات"
        description="ظاهر، اعلان‌ها، نصب روی دستگاه و پشتیبان داده‌های بسنج را از اینجا مدیریت کن."
        className="sm:max-w-xl"
      >
        <div className="space-y-6 p-4 sm:p-5">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Settings2 className="size-4 text-primary" />
              <div>
                <h3 className="type-card-title">حالت نمایش</h3>
                <p className="type-caption text-muted-foreground">
                  روشن، تاریک یا هماهنگ با دستگاه
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {APPEARANCE_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = currentTheme === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    aria-pressed={active}
                    onClick={() => setTheme(option.value)}
                    className={cn(
                      "relative !h-auto min-h-24 flex-col gap-1.5 rounded-2xl px-2 py-3 text-center !whitespace-normal",
                      active &&
                        "border-primary/55 bg-primary/[0.08] ring-1 ring-primary/20"
                    )}
                  >
                    {active ? (
                      <span className="absolute start-2 top-2 grid size-5 place-items-center rounded-full bg-primary text-primary-foreground">
                        <Check className="size-3" />
                      </span>
                    ) : null}
                    <Icon
                      className={cn(
                        "size-5",
                        active ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <span className="type-label">{option.label}</span>
                    <span className="text-[.68rem] leading-5 text-muted-foreground">
                      {option.description}
                    </span>
                  </Button>
                );
              })}
            </div>
          </section>

          <section className="border-t border-border pt-5">
            <div className="mb-3 flex items-center gap-2">
              <Palette className="size-4 text-primary" />
              <div>
                <h3 className="type-card-title">رنگ اصلی</h3>
                <p className="type-caption text-muted-foreground">
                  رنگ اکشن‌ها، نمودارها و تأکیدهای اصلی
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {PALETTE_OPTIONS.map((option) => {
                const active = preferences.palette === option.value;
                return (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    aria-pressed={active}
                    onClick={() => preferences.setPalette(option.value)}
                    className={cn(
                      "!h-auto justify-start gap-2 rounded-xl p-2.5 text-start",
                      active &&
                        "border-primary/55 ring-1 ring-primary/20"
                    )}
                  >
                    <span
                      className="grid size-8 shrink-0 place-items-center rounded-lg text-white shadow-sm"
                      style={{ backgroundColor: option.css }}
                    >
                      {active ? <Check className="size-4" /> : null}
                    </span>
                    <span className="type-label min-w-0 truncate">
                      {option.label}
                    </span>
                  </Button>
                );
              })}

              <Button
                type="button"
                variant="outline"
                aria-pressed={preferences.palette === "custom"}
                onClick={() => setCustomOpen(true)}
                className={cn(
                  "!h-auto justify-start gap-2 rounded-xl p-2.5 text-start",
                  preferences.palette === "custom" &&
                    "border-primary/55 ring-1 ring-primary/20"
                )}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-white shadow-sm"
                  style={{ backgroundColor: preferences.customColor }}
                >
                  <WandSparkles className="size-4 mix-blend-difference" />
                </span>
                <span className="type-label min-w-0 truncate">سفارشی</span>
              </Button>
            </div>
          </section>

          <NotificationSettingsSection />

          <DataBackupSection />

          <PwaInstallSection />

          <div className="rounded-2xl border border-border bg-muted/45 p-3.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="type-label">ذخیره روی همین دستگاه</div>
                <p className="type-caption mt-0.5 text-muted-foreground">
                  اطلاعات بسنج روی همین مرورگر می‌ماند؛ برای انتقال دستگاه یا
                  اطمینان از حفظ پیوست‌ها، از بخش پشتیبان فایل خروجی بگیر.
                </p>
              </div>
              <Badge variant="secondary">محلی</Badge>
            </div>
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="button" onClick={() => onOpenChange(false)}>
              تمام
            </Button>
          </div>
        </div>
      </ResponsiveSheet>

      <CustomThemeColorSheet
        open={customOpen}
        onOpenChange={setCustomOpen}
      />
    </>
  );
}
