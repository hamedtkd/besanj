"use client";

import {
  buildBesanjBackupFile,
  decodeBackupAttachments,
  type BesanjBackupFile,
  type PortablePreferences,
} from "./backup-format";
import { db } from "./db";
import {
  normalizeThemeMode,
  THEME_COOKIE_NAME,
  THEME_STORAGE_KEY,
} from "./theme";
import { normalizeHexColor, normalizeSavedThemeColors } from "./theme-color";

export const BESANJ_APP_VERSION = "1.2.0";

const PALETTE_STORAGE_KEY = "estelamkoo:palette";
const CUSTOM_COLOR_STORAGE_KEY = "estelamkoo:custom-color";
const SAVED_COLORS_STORAGE_KEY = "estelamkoo:saved-colors";
const PALETTE_VERSION_STORAGE_KEY = "estelamkoo:palette-version";
const CURRENT_PALETTE_VERSION = "2";
const VALID_PALETTES = new Set(["amber", "blue", "violet", "rose", "custom"]);

function readPreferences(): PortablePreferences {
  let savedColors: string[] = [];
  try {
    const raw: unknown = JSON.parse(
      window.localStorage.getItem(SAVED_COLORS_STORAGE_KEY) ?? "[]"
    );
    if (Array.isArray(raw)) {
      savedColors = normalizeSavedThemeColors(
        raw.filter((value: unknown): value is string => typeof value === "string")
      );
    }
  } catch {
    savedColors = [];
  }

  const theme =
    normalizeThemeMode(window.localStorage.getItem(THEME_STORAGE_KEY)) ?? undefined;
  const paletteRaw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
  const palette =
    paletteRaw && VALID_PALETTES.has(paletteRaw)
      ? (paletteRaw as PortablePreferences["palette"])
      : undefined;
  const customColor =
    normalizeHexColor(window.localStorage.getItem(CUSTOM_COLOR_STORAGE_KEY) ?? "") ??
    undefined;

  return {
    ...(theme ? { theme } : {}),
    ...(palette ? { palette } : {}),
    ...(customColor ? { customColor } : {}),
    ...(savedColors.length ? { savedColors } : {}),
  };
}

function writePreferences(preferences?: PortablePreferences) {
  if (!preferences) return;

  const theme = normalizeThemeMode(preferences.theme);
  if (theme) {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.cookie = `${THEME_COOKIE_NAME}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  if (preferences.palette && VALID_PALETTES.has(preferences.palette)) {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, preferences.palette);
    window.localStorage.setItem(
      PALETTE_VERSION_STORAGE_KEY,
      CURRENT_PALETTE_VERSION
    );
  }

  const customColor = normalizeHexColor(preferences.customColor ?? "");
  if (customColor) {
    window.localStorage.setItem(CUSTOM_COLOR_STORAGE_KEY, customColor);
  }

  if (preferences.savedColors) {
    window.localStorage.setItem(
      SAVED_COLORS_STORAGE_KEY,
      JSON.stringify(normalizeSavedThemeColors(preferences.savedColors))
    );
  }
}

export async function createFullBackup() {
  const [purchaseCases, providers, quotes, reminders, attachments, budgetPlans] =
    await Promise.all([
      db.purchaseCases.toArray(),
      db.providers.toArray(),
      db.quotes.toArray(),
      db.reminders.toArray(),
      db.attachments.toArray(),
      db.budgetPlans.toArray(),
    ]);

  return buildBesanjBackupFile(
    { purchaseCases, providers, quotes, reminders, attachments, budgetPlans },
    {
      appVersion: BESANJ_APP_VERSION,
      preferences: readPreferences(),
    }
  );
}

export async function replaceWithBackup(backup: BesanjBackupFile) {
  const attachments = decodeBackupAttachments(backup.data.attachments);

  await db.transaction(
    "rw",
    [
      db.purchaseCases,
      db.providers,
      db.quotes,
      db.reminders,
      db.attachments,
      db.budgetPlans,
    ],
    async () => {
      await db.attachments.clear();
      await db.budgetPlans.clear();
      await db.reminders.clear();
      await db.quotes.clear();
      await db.providers.clear();
      await db.purchaseCases.clear();

      if (backup.data.purchaseCases.length) {
        await db.purchaseCases.bulkAdd(backup.data.purchaseCases);
      }
      if (backup.data.providers.length) {
        await db.providers.bulkAdd(backup.data.providers);
      }
      if (backup.data.quotes.length) {
        await db.quotes.bulkAdd(backup.data.quotes);
      }
      if (backup.data.reminders.length) {
        await db.reminders.bulkAdd(backup.data.reminders);
      }
      if (attachments.length) {
        await db.attachments.bulkAdd(attachments);
      }
      if (backup.data.budgetPlans?.length) {
        await db.budgetPlans.bulkAdd(backup.data.budgetPlans);
      }
    }
  );

  writePreferences(backup.preferences);
}

export async function readBackupStats() {
  const [cases, providers, quotes, reminders, attachments, budgetPlans] = await Promise.all([
    db.purchaseCases.count(),
    db.providers.count(),
    db.quotes.count(),
    db.reminders.count(),
    db.attachments.toArray(),
    db.budgetPlans.count(),
  ]);

  return {
    cases,
    providers,
    quotes,
    reminders,
    attachments: attachments.length,
    budgetPlans,
    attachmentBytes: attachments.reduce(
      (sum, attachment) => sum + attachment.size,
      0
    ),
  };
}
