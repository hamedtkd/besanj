"use client";

import * as React from "react";
import { useAppTheme } from "@/components/app-theme";
import {
  buildCustomThemeTokens,
  DEFAULT_CUSTOM_THEME_COLOR,
  normalizeHexColor,
  normalizeSavedThemeColors,
} from "@/lib/theme-color";

export type AppPalette = "amber" | "blue" | "violet" | "rose" | "custom";

const PALETTE_STORAGE_KEY = "estelamkoo:palette";
const CUSTOM_COLOR_STORAGE_KEY = "estelamkoo:custom-color";
const SAVED_COLORS_STORAGE_KEY = "estelamkoo:saved-colors";
const PALETTE_VERSION_STORAGE_KEY = "estelamkoo:palette-version";
const CURRENT_PALETTE_VERSION = "2";
const VALID_PALETTES: AppPalette[] = [
  "amber",
  "blue",
  "violet",
  "rose",
  "custom",
];

const PALETTE_THEME_COLORS: Record<Exclude<AppPalette, "custom">, string> = {
  amber: "#9a6f0a",
  blue: "#2563eb",
  violet: "#7c3aed",
  rose: "#db2777",
};

const CUSTOM_TOKEN_NAMES = [
  "--primary",
  "--primary-foreground",
  "--ring",
  "--chart-1",
  "--chart-2",
  "--chart-3",
  "--chart-4",
  "--chart-5",
  "--chart-6",
  "--chart-7",
  "--chart-8",
  "--glass-border",
] as const;

function clearCustomTheme(root: HTMLElement) {
  for (const name of CUSTOM_TOKEN_NAMES) root.style.removeProperty(name);
}

function applyPalette(
  palette: AppPalette,
  customColor: string,
  dark: boolean
) {
  const root = document.documentElement;
  clearCustomTheme(root);
  root.dataset.palette = palette;

  const themeColor =
    palette === "custom"
      ? normalizeHexColor(customColor) ?? DEFAULT_CUSTOM_THEME_COLOR
      : PALETTE_THEME_COLORS[palette];

  if (palette === "custom") {
    const tokens = buildCustomThemeTokens(themeColor, dark);
    for (const [name, value] of Object.entries(tokens)) {
      root.style.setProperty(name, value);
    }
  }

  document
    .querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    ?.setAttribute("content", themeColor);
}

interface AppPreferencesValue {
  palette: AppPalette;
  customColor: string;
  savedColors: string[];
  setPalette: (palette: AppPalette) => void;
  previewCustomColor: (color: string) => void;
  restorePalette: () => void;
  setCustomPalette: (color: string, savedColors?: readonly string[]) => void;
}

const AppPreferencesContext =
  React.createContext<AppPreferencesValue | null>(null);

export function AppPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useAppTheme();
  const [hydrated, setHydrated] = React.useState(false);
  const [palette, setPaletteState] = React.useState<AppPalette>("blue");
  const [customColor, setCustomColor] = React.useState(
    DEFAULT_CUSTOM_THEME_COLOR
  );
  const [savedColors, setSavedColors] = React.useState<string[]>([]);

  const dark = resolvedTheme === "dark";

  React.useEffect(() => {
    let storedPalette = window.localStorage.getItem(
      PALETTE_STORAGE_KEY
    ) as AppPalette | null;
    const paletteVersion = window.localStorage.getItem(
      PALETTE_VERSION_STORAGE_KEY
    );

    // v0.4.4 changes the product default from amber to the new blue brand.
    // Only migrate the legacy amber default once; custom/other explicit choices stay intact.
    if (paletteVersion !== CURRENT_PALETTE_VERSION && storedPalette === "amber") {
      storedPalette = "blue";
      window.localStorage.setItem(PALETTE_STORAGE_KEY, "blue");
    }
    window.localStorage.setItem(
      PALETTE_VERSION_STORAGE_KEY,
      CURRENT_PALETTE_VERSION
    );
    const storedCustom =
      normalizeHexColor(
        window.localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY) ?? ""
      ) ?? DEFAULT_CUSTOM_THEME_COLOR;

    let storedSaved: string[] = [];
    try {
      const parsed: unknown = JSON.parse(
        window.localStorage.getItem(SAVED_COLORS_STORAGE_KEY) ?? "[]"
      );
      if (Array.isArray(parsed)) {
        storedSaved = normalizeSavedThemeColors(
          parsed.filter(
            (value: unknown): value is string => typeof value === "string"
          )
        );
      }
    } catch {
      storedSaved = [];
    }

    const frame = window.requestAnimationFrame(() => {
      if (storedPalette && VALID_PALETTES.includes(storedPalette)) {
        setPaletteState(storedPalette);
      }
      setCustomColor(storedCustom);
      setSavedColors(storedSaved);
      setHydrated(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    applyPalette(palette, customColor, dark);
  }, [dark, hydrated, palette, customColor]);

  const setPalette = React.useCallback(
    (next: AppPalette) => {
      setPaletteState(next);
      window.localStorage.setItem(PALETTE_STORAGE_KEY, next);
      applyPalette(next, customColor, dark);
    },
    [customColor, dark]
  );

  const previewCustomColor = React.useCallback(
    (color: string) => {
      const normalized = normalizeHexColor(color);
      if (!normalized) return;
      applyPalette("custom", normalized, dark);
    },
    [dark]
  );

  const restorePalette = React.useCallback(() => {
    applyPalette(palette, customColor, dark);
  }, [customColor, dark, palette]);

  const setCustomPalette = React.useCallback(
    (
      color: string,
      nextSavedColors: readonly string[] = savedColors
    ) => {
      const normalized =
        normalizeHexColor(color) ?? DEFAULT_CUSTOM_THEME_COLOR;
      const normalizedSaved = normalizeSavedThemeColors(nextSavedColors);

      setCustomColor(normalized);
      setSavedColors(normalizedSaved);
      setPaletteState("custom");

      window.localStorage.setItem(PALETTE_STORAGE_KEY, "custom");
      window.localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, normalized);
      window.localStorage.setItem(
        SAVED_COLORS_STORAGE_KEY,
        JSON.stringify(normalizedSaved)
      );
      applyPalette("custom", normalized, dark);
    },
    [dark, savedColors]
  );

  const value = React.useMemo<AppPreferencesValue>(
    () => ({
      palette,
      customColor,
      savedColors,
      setPalette,
      previewCustomColor,
      restorePalette,
      setCustomPalette,
    }),
    [
      customColor,
      palette,
      previewCustomColor,
      restorePalette,
      savedColors,
      setCustomPalette,
      setPalette,
    ]
  );

  return (
    <AppPreferencesContext.Provider value={value}>
      {children}
    </AppPreferencesContext.Provider>
  );
}

export function useAppPreferences() {
  const context = React.useContext(AppPreferencesContext);
  if (!context) {
    throw new Error(
      "useAppPreferences must be used within AppPreferencesProvider"
    );
  }
  return context;
}
