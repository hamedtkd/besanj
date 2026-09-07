"use client";

import * as React from "react";
import {
  normalizeThemeMode,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeMode,
} from "@/lib/theme";

const THEME_CHANGE_EVENT = "estelamkoo:theme-change";
const SYSTEM_QUERY = "(prefers-color-scheme: dark)";

interface AppThemeValue {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const AppThemeContext = React.createContext<AppThemeValue | null>(null);

function readStoredTheme(fallback: ThemeMode): ThemeMode {
  if (typeof window === "undefined") return fallback;
  try {
    return normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY)) ?? fallback;
  } catch {
    return fallback;
  }
}

function readSystemDark() {
  return typeof window !== "undefined" && window.matchMedia(SYSTEM_QUERY).matches;
}

function resolveTheme(theme: ThemeMode, systemDark: boolean): ResolvedTheme {
  if (theme === "system") return systemDark ? "dark" : "light";
  return theme;
}

function applyResolvedTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
}

function persistTheme(theme: ThemeMode) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme still works for the current session if storage is unavailable.
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

function subscribeTheme(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY) callback();
  };
  const onThemeChange = () => callback();
  window.addEventListener("storage", onStorage);
  window.addEventListener(THEME_CHANGE_EVENT, onThemeChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(THEME_CHANGE_EVENT, onThemeChange);
  };
}

function subscribeSystemTheme(callback: () => void) {
  const media = window.matchMedia(SYSTEM_QUERY);
  media.addEventListener("change", callback);
  return () => media.removeEventListener("change", callback);
}

export function AppThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: ThemeMode;
}) {
  const theme = React.useSyncExternalStore(
    subscribeTheme,
    () => readStoredTheme(initialTheme),
    () => initialTheme
  );
  const systemDark = React.useSyncExternalStore(
    subscribeSystemTheme,
    readSystemDark,
    () => false
  );
  const resolvedTheme = resolveTheme(theme, systemDark);

  React.useEffect(() => {
    applyResolvedTheme(resolvedTheme);
    persistTheme(theme);
  }, [resolvedTheme, theme]);

  const setTheme = React.useCallback((next: ThemeMode) => {
    const nextResolved = resolveTheme(next, readSystemDark());
    persistTheme(next);
    applyResolvedTheme(nextResolved);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const toggleTheme = React.useCallback(() => {
    const current = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(current === "dark" ? "light" : "dark");
  }, [setTheme]);

  const value = React.useMemo<AppThemeValue>(
    () => ({ theme, resolvedTheme, setTheme, toggleTheme }),
    [resolvedTheme, setTheme, theme, toggleTheme]
  );

  return (
    <AppThemeContext.Provider value={value}>{children}</AppThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = React.useContext(AppThemeContext);
  if (!context) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return context;
}
