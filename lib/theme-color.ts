export type HsvColor = { h: number; s: number; v: number };

export const DEFAULT_CUSTOM_THEME_COLOR = "#2563eb";
export const MAX_SAVED_THEME_COLORS = 8;

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function normalizeHexColor(value: string) {
  const raw = value.trim().replace(/^#/, "");
  if (/^[\da-f]{3}$/i.test(raw)) {
    return `#${raw
      .split("")
      .map((char) => char + char)
      .join("")
      .toLowerCase()}`;
  }
  return /^[\da-f]{6}$/i.test(raw) ? `#${raw.toLowerCase()}` : null;
}

export function hexToRgb(hex: string) {
  const normalized = normalizeHexColor(hex);
  if (!normalized) return null;
  const value = Number.parseInt(normalized.slice(1), 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

export function rgbToHex(r: number, g: number, b: number) {
  return `#${[r, g, b]
    .map((value) =>
      Math.round(clamp(value, 0, 255)).toString(16).padStart(2, "0")
    )
    .join("")}`;
}

export function hexToHsv(hex: string): HsvColor {
  const rgb = hexToRgb(hex) ?? hexToRgb(DEFAULT_CUSTOM_THEME_COLOR)!;
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  if (h < 0) h += 360;

  return { h, s: max === 0 ? 0 : delta / max, v: max };
}

export function hsvToHex({ h, s, v }: HsvColor) {
  const hue = ((h % 360) + 360) % 360;
  const saturation = clamp(s);
  const value = clamp(v);
  const c = value * saturation;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = value - c;
  const [r, g, b] =
    hue < 60
      ? [c, x, 0]
      : hue < 120
        ? [x, c, 0]
        : hue < 180
          ? [0, c, x]
          : hue < 240
            ? [0, x, c]
            : hue < 300
              ? [x, 0, c]
              : [c, 0, x];

  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}

function mixHex(left: string, right: string, weight: number) {
  const a = hexToRgb(left)!;
  const b = hexToRgb(right)!;
  const t = clamp(weight);
  return rgbToHex(
    a.r + (b.r - a.r) * t,
    a.g + (b.g - a.g) * t,
    a.b + (b.b - a.b) * t
  );
}

function relativeLuminance(hex: string) {
  const rgb = hexToRgb(hex)!;
  const channels = [rgb.r, rgb.g, rgb.b].map((value) => {
    const channel = value / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(left: string, right: string) {
  const a = relativeLuminance(left);
  const b = relativeLuminance(right);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function readableForeground(background: string) {
  const normalized =
    normalizeHexColor(background) ?? DEFAULT_CUSTOM_THEME_COLOR;
  return contrastRatio(normalized, "#ffffff") >=
    contrastRatio(normalized, "#111111")
    ? "#ffffff"
    : "#111111";
}

export function buildCustomThemeTokens(color: string, dark: boolean) {
  const primary = normalizeHexColor(color) ?? DEFAULT_CUSTOM_THEME_COLOR;
  const toward = dark ? "#ffffff" : "#000000";
  const rgb = hexToRgb(primary)!;

  return {
    "--primary": primary,
    "--primary-foreground": readableForeground(primary),
    "--ring": mixHex(primary, toward, dark ? 0.16 : 0.1),
    "--chart-1": mixHex(primary, "#ffffff", dark ? 0.3 : 0.05),
    "--chart-2": mixHex(primary, dark ? "#60a5fa" : "#2563eb", 0.5),
    "--chart-3": mixHex(primary, dark ? "#4ade80" : "#15803d", 0.55),
    "--chart-4": mixHex(primary, dark ? "#a78bfa" : "#7c3aed", 0.55),
    "--chart-5": mixHex(primary, dark ? "#fb923c" : "#c2410c", 0.55),
    "--chart-6": mixHex(primary, dark ? "#2dd4bf" : "#0f766e", 0.55),
    "--chart-7": mixHex(primary, dark ? "#f472b6" : "#be185d", 0.55),
    "--chart-8": mixHex(primary, dark ? "#94a3b8" : "#475569", 0.55),
    "--glass-border": `rgb(${rgb.r} ${rgb.g} ${rgb.b} / ${dark ? "28%" : "22%"})`,
  } as const;
}

export function normalizeSavedThemeColors(
  colors: readonly string[] | undefined
) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const color of colors ?? []) {
    const normalized = normalizeHexColor(color);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
    if (result.length >= MAX_SAVED_THEME_COLORS) break;
  }

  return result;
}
