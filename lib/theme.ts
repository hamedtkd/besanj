export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const THEME_COOKIE_NAME = "estelamkoo-theme";

export function normalizeThemeMode(value: string | null | undefined): ThemeMode | null {
  return value === "system" || value === "light" || value === "dark" ? value : null;
}
