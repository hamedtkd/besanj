"use client";

import * as React from "react";
import { Check, Monitor, Moon, Palette, Settings2, Sun } from "lucide-react";
import { useAppTheme } from "@/components/app-theme";
import {
  useAppPreferences,
  type AppPalette,
} from "@/components/app-preferences";
import { CustomThemeColorSheet } from "@/components/custom-theme-color-sheet";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const PALETTES: Array<{
  value: Exclude<AppPalette, "custom">;
  label: string;
  light: string;
  dark: string;
}> = [
  { value: "blue", label: "آبی برند", light: "#2563eb", dark: "#60a5fa" },
  { value: "violet", label: "بنفش", light: "#7c3aed", dark: "#a78bfa" },
  { value: "amber", label: "کهربایی", light: "#9a6f0a", dark: "#d4a72c" },
  { value: "rose", label: "رز", light: "#db2777", dark: "#f472b6" },
];

const THEME_OPTIONS = [
  { value: "system", label: "سیستم", icon: Monitor },
  { value: "light", label: "روشن", icon: Sun },
  { value: "dark", label: "تاریک", icon: Moon },
] as const;

export function ThemeQuickActions({
  onOpenSettings,
}: {
  onOpenSettings: () => void;
}) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useAppTheme();
  const preferences = useAppPreferences();
  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [customOpen, setCustomOpen] = React.useState(false);

  const isDark = resolvedTheme === "dark";
  const quickThemeLabel = "تغییر حالت روشن و تاریک";

  function openFullSettings() {
    setPaletteOpen(false);
    onOpenSettings();
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={quickThemeLabel}
        title={quickThemeLabel}
        onClick={toggleTheme}
      >
        <Sun className="hidden dark:block" />
        <Moon className="dark:hidden" />
      </Button>

      <Popover open={paletteOpen} onOpenChange={setPaletteOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="تغییر سریع تم و رنگ"
              title="تغییر سریع تم و رنگ"
            >
              <span
                className="size-4 rounded-full border border-foreground/20 shadow-sm"
                style={{ backgroundColor: "var(--primary)" }}
              />
            </Button>
          }
        />
        <PopoverContent className="w-[min(21rem,calc(100vw-1rem))] p-3" align="end">
          <div className="mb-3 flex items-center gap-2">
            <Palette className="size-4 text-primary" />
            <div>
              <div className="type-label">تم سریع</div>
              <div className="type-caption text-muted-foreground">
                بدون رفتن به تنظیمات، حالت و رنگ را عوض کن.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-muted/55 p-1.5">
            {THEME_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = theme === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "ghost"}
                  className="px-2"
                  onClick={() => setTheme(option.value)}
                >
                  <Icon />
                  {option.label}
                </Button>
              );
            })}
          </div>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {PALETTES.map((option) => {
              const active = preferences.palette === option.value;
              return (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`رنگ ${option.label}`}
                  aria-pressed={active}
                  className={cn(
                    "relative mx-auto size-10 rounded-xl p-0 transition hover:-translate-y-0.5 hover:shadow-sm",
                    active && "border-primary ring-2 ring-primary/20"
                  )}
                  onClick={() => preferences.setPalette(option.value)}
                >
                  <span
                    className="size-6 rounded-lg shadow-sm"
                    style={{ backgroundColor: isDark ? option.dark : option.light }}
                  />
                  {active ? (
                    <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-2.5" />
                    </span>
                  ) : null}
                </Button>
              );
            })}
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="رنگ سفارشی"
              aria-pressed={preferences.palette === "custom"}
              className={cn(
                "relative mx-auto size-10 rounded-xl p-0 transition hover:-translate-y-0.5 hover:shadow-sm",
                preferences.palette === "custom" &&
                  "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => {
                setPaletteOpen(false);
                window.requestAnimationFrame(() => setCustomOpen(true));
              }}
            >
              <span
                className="grid size-6 place-items-center rounded-lg text-white shadow-sm"
                style={{ backgroundColor: preferences.customColor }}
              >
                <Palette className="size-3.5 mix-blend-difference" />
              </span>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full justify-start"
            onClick={openFullSettings}
          >
            <Settings2 />
            تنظیمات کامل ظاهر
          </Button>
        </PopoverContent>
      </Popover>

      <CustomThemeColorSheet open={customOpen} onOpenChange={setCustomOpen} />
    </>
  );
}
