import { normalizePersianDigits } from "./normalize-persian-digits.ts";
import { parsePersianNumberWords } from "./spoken-persian-number.ts";

export interface QuickAmountResult {
  valueToman?: number;
  warning?: string;
  assumedMillions?: boolean;
}

function cleanNumberText(value: string) {
  return normalizePersianDigits(value)
    .replace(/[٬,،\s]/g, "")
    .replace(/[^\d.]/g, "");
}

function scaleFromText(value: string) {
  const text = value.toLocaleLowerCase("fa-IR");
  if (/میلیارد/.test(text)) return 1_000_000_000;
  if (/میلیون|\d\s*م(?:\s|$)/.test(text)) return 1_000_000;
  if (/هزار/.test(text)) return 1_000;
  return 1;
}

export function parseQuickToman(input: string): QuickAmountResult {
  const raw = input.trim();
  if (!raw) return {};

  const normalized = normalizePersianDigits(raw)
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/تومن/g, "تومان")
    .trim();

  const hasRial = /ریال/.test(normalized);
  const scale = scaleFromText(normalized);
  const numeric = cleanNumberText(normalized);

  let value: number | undefined;
  if (numeric) {
    const parsed = Number(numeric);
    if (Number.isFinite(parsed) && parsed > 0) value = parsed * scale;
  } else {
    const words = normalized
      .replace(/تومان|ریال/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const parsedWords = parsePersianNumberWords(words);
    if (parsedWords !== undefined && parsedWords > 0) value = parsedWords;
  }

  if (!value || !Number.isFinite(value)) return {};
  if (hasRial) value /= 10;

  const hasExplicitScale = scale !== 1 || /هزار|میلیون|میلیارد/.test(normalized);
  const hasExplicitUnit = /تومان|ریال/.test(normalized);
  const isBareSmallNumber = !hasExplicitScale && !hasExplicitUnit && value > 0 && value < 1_000;

  if (isBareSmallNumber) {
    const assumed = Math.round(value * 1_000_000);
    return {
      valueToman: assumed,
      assumedMillions: true,
      warning: `${raw} به‌عنوان میلیون تومان برداشت شد؛ مبلغ نهایی را قبل از ثبت بررسی کن.`,
    };
  }

  return { valueToman: Math.round(value) };
}

export interface QuickCaptureDraftState {
  mode: "case" | "quote";
  kind?: "product" | "service";
  text: string;
  caseId?: string;
  caseTitle?: string;
  providerName?: string;
  phone?: string;
  sellerProfileId?: string;
  amountText?: string;
  updatedAt: string;
}

export const QUICK_CAPTURE_DRAFT_KEY = "besanj.quick-capture.v1";
export const QUICK_CAPTURE_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function parseQuickCaptureDraft(value: string | null, now = Date.now()) {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value) as Partial<QuickCaptureDraftState>;
    if (parsed.mode !== "case" && parsed.mode !== "quote") return undefined;
    if (typeof parsed.text !== "string") return undefined;
    if (typeof parsed.updatedAt !== "string") return undefined;
    const age = now - new Date(parsed.updatedAt).getTime();
    if (!Number.isFinite(age) || age < 0 || age > QUICK_CAPTURE_DRAFT_MAX_AGE_MS) {
      return undefined;
    }
    return parsed as QuickCaptureDraftState;
  } catch {
    return undefined;
  }
}
