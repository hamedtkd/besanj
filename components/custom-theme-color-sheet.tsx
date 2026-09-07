"use client";

import * as React from "react";
import { Check, Palette, Plus } from "lucide-react";
import { useAppPreferences } from "@/components/app-preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import {
  DEFAULT_CUSTOM_THEME_COLOR,
  hexToHsv,
  hsvToHex,
  normalizeHexColor,
  normalizeSavedThemeColors,
  type HsvColor,
} from "@/lib/theme-color";
import { cn } from "@/lib/utils";

export function CustomThemeColorSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const {
    customColor,
    savedColors,
    previewCustomColor,
    restorePalette,
    setCustomPalette,
  } = useAppPreferences();
  const initial = customColor || DEFAULT_CUSTOM_THEME_COLOR;
  const [hsv, setHsv] = React.useState<HsvColor>(() => hexToHsv(initial));
  const [hexDraft, setHexDraft] = React.useState(initial);
  const [saved, setSaved] = React.useState<string[]>(savedColors);
  const committed = React.useRef(false);
  const hex = React.useMemo(() => hsvToHex(hsv), [hsv]);

  React.useEffect(() => {
    if (!open) return;
    const next = customColor || DEFAULT_CUSTOM_THEME_COLOR;
    const frame = window.requestAnimationFrame(() => {
      committed.current = false;
      setHsv(hexToHsv(next));
      setHexDraft(next);
      setSaved(savedColors);
      previewCustomColor(next);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [customColor, open, previewCustomColor, savedColors]);

  function preview(next: HsvColor) {
    setHsv(next);
    const nextHex = hsvToHex(next);
    setHexDraft(nextHex);
    previewCustomColor(nextHex);
  }

  function chooseColor(color: string) {
    const normalized = normalizeHexColor(color);
    if (normalized) preview(hexToHsv(normalized));
  }

  function setHex(value: string) {
    setHexDraft(value);
    const normalized = normalizeHexColor(value);
    if (normalized) chooseColor(normalized);
  }

  function handleOpenChange(next: boolean) {
    if (!next && !committed.current) restorePalette();
    onOpenChange(next);
  }

  function addSavedColor() {
    setSaved((current) => normalizeSavedThemeColors([hex, ...current]));
  }

  function apply() {
    committed.current = true;
    setCustomPalette(hex, saved);
    onOpenChange(false);
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="رنگ سفارشی"
      description="رنگ اصلی رابط را بساز؛ پیش‌نمایش زنده است و فقط با «اعمال رنگ» ذخیره می‌شود."
      className="sm:max-w-lg"
      layerClassName="z-[120]"
    >
      <div className="space-y-4 p-4 sm:p-5">
        <SaturationValueField value={hsv} onChange={preview} />
        <HueField value={hsv.h} onChange={(h) => preview({ ...hsv, h })} />

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="space-y-1.5">
            <span className="type-label block">کد رنگ</span>
            <Input
              dir="ltr"
              value={hexDraft}
              onChange={(event) => setHex(event.target.value)}
              onBlur={() => setHexDraft(hex)}
              aria-invalid={!normalizeHexColor(hexDraft)}
              className="type-data uppercase"
              placeholder="#db2777"
            />
          </label>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
            <span
              className="size-9 rounded-lg border border-border shadow-sm"
              style={{ backgroundColor: hex }}
              aria-hidden
            />
            <span dir="ltr" className="type-data px-1 text-sm">
              {hex.toUpperCase()}
            </span>
          </div>
        </div>

        <section className="rounded-2xl border border-border bg-muted/35 p-3.5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <div className="type-label">رنگ‌های من</div>
              <p className="type-caption text-muted-foreground">
                حداکثر ۸ رنگ روی همین دستگاه نگه داشته می‌شود.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={addSavedColor}
              disabled={saved.includes(hex)}
            >
              <Plus />
              افزودن
            </Button>
          </div>
          <div className="flex min-h-10 flex-wrap gap-2">
            {saved.length ? (
              saved.map((color) => (
                <Button
                  key={color}
                  type="button"
                  size="icon"
                  variant="outline"
                  aria-label={`انتخاب رنگ ${color}`}
                  onClick={() => chooseColor(color)}
                  className={cn(
                    "relative size-10 rounded-full border-2 p-0",
                    color === hex &&
                      "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  )}
                  style={{ backgroundColor: color }}
                >
                  {color === hex ? (
                    <Check className="size-4 text-white mix-blend-difference" />
                  ) : null}
                </Button>
              ))
            ) : (
              <span className="type-caption text-muted-foreground">
                هنوز رنگی ذخیره نکرده‌ای.
              </span>
            )}
          </div>
        </section>

        <div className="flex items-center gap-3 rounded-2xl border border-border bg-background p-3.5">
          <span
            className="grid size-11 shrink-0 place-items-center rounded-2xl border border-white/20 shadow-sm"
            style={{ backgroundColor: hex }}
          >
            <Palette className="size-5 text-white mix-blend-difference" />
          </span>
          <div className="min-w-0">
            <div className="type-label">پیش‌نمایش تم</div>
            <div className="type-caption text-muted-foreground">
              دکمه‌ها، Ring و رنگ‌های نمودار از این رنگ مشتق می‌شوند.
            </div>
          </div>
          <Button type="button" size="sm" className="ms-auto">
            نمونه
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            انصراف
          </Button>
          <Button type="button" onClick={apply}>
            اعمال رنگ
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}

function SaturationValueField({
  value,
  onChange,
}: {
  value: HsvColor;
  onChange: (value: HsvColor) => void;
}) {
  const fieldRef = React.useRef<HTMLDivElement>(null);

  function update(clientX: number, clientY: number) {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const s = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const v =
      1 - Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    onChange({ ...value, s, v });
  }

  return (
    <div
      ref={fieldRef}
      role="slider"
      tabIndex={0}
      aria-label="اشباع و روشنایی رنگ"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value.s * 100)}
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
          update(event.clientX, event.clientY);
        }
      }}
      onKeyDown={(event) => {
        const step = event.shiftKey ? 0.1 : 0.02;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          onChange({ ...value, s: Math.min(1, value.s + step) });
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          onChange({ ...value, s: Math.max(0, value.s - step) });
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          onChange({ ...value, v: Math.min(1, value.v + step) });
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          onChange({ ...value, v: Math.max(0, value.v - step) });
        }
      }}
      className="relative h-44 cursor-crosshair touch-none overflow-hidden rounded-2xl border border-border outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:h-48"
      style={{
        backgroundColor: `hsl(${value.h} 100% 50%)`,
        backgroundImage:
          "linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent)",
      }}
    >
      <span
        className="pointer-events-none absolute size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg"
        style={{
          left: `${value.s * 100}%`,
          top: `${(1 - value.v) * 100}%`,
        }}
      />
    </div>
  );
}

function HueField({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  function update(clientX: number) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    onChange(Math.round(ratio * 359));
  }

  return (
    <div>
      <div className="type-label mb-2">طیف رنگ</div>
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label="طیف رنگ"
        aria-valuemin={0}
        aria-valuemax={359}
        aria-valuenow={Math.round(value)}
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          update(event.clientX);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            update(event.clientX);
          }
        }}
        onKeyDown={(event) => {
          const step = event.shiftKey ? 10 : 2;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            onChange(Math.min(359, value + step));
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            onChange(Math.max(0, value - step));
          }
        }}
        className="relative h-5 cursor-pointer touch-none rounded-full border border-border outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{
          background:
            "linear-gradient(90deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)",
        }}
      >
        <span
          className="pointer-events-none absolute top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-transparent shadow-lg"
          style={{ left: `${(value / 359) * 100}%` }}
        />
      </div>
    </div>
  );
}
