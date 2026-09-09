import type { PurchaseKind, QuoteChannel } from "@/lib/types";
import { PERSIAN_DATE_LOCALE, PERSIAN_NUMBER_LOCALE, toPersianDigits } from "./persian-number.ts";
import { normalizeOptionalText } from "./validation-rules.ts";

const tomanFormatter = new Intl.NumberFormat(PERSIAN_NUMBER_LOCALE, { maximumFractionDigits: 0 });
const integerFormatter = new Intl.NumberFormat(PERSIAN_NUMBER_LOCALE, { maximumFractionDigits: 0 });

const persianDateFormatter = new Intl.DateTimeFormat(PERSIAN_DATE_LOCALE, {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const compactDateFormatter = new Intl.DateTimeFormat(PERSIAN_DATE_LOCALE, {
  month: "short",
  day: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(PERSIAN_DATE_LOCALE, {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatToman(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return tomanFormatter.format(Math.round(value));
}

export function formatInteger(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return integerFormatter.format(Math.round(value));
}

export function formatPersianDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return persianDateFormatter.format(date);
}

export function formatCompactPersianDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return compactDateFormatter.format(date);
}

export function formatPersianDateTime(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}

export function kindLabel(kind: PurchaseKind) {
  return kind === "product" ? "کالا" : "خدمت";
}

export const QUOTE_CHANNELS: Array<{ value: QuoteChannel; label: string }> = [
  { value: "phone", label: "تماس تلفنی" },
  { value: "whatsapp", label: "واتساپ" },
  { value: "instagram", label: "دایرکت اینستاگرام" },
  { value: "telegram", label: "تلگرام" },
  { value: "inPerson", label: "حضوری" },
  { value: "web", label: "وب‌سایت" },
  { value: "sms", label: "پیامک" },
  { value: "email", label: "ایمیل" },
  { value: "bale", label: "بله" },
  { value: "eitaa", label: "ایتا" },
  { value: "rubika", label: "روبیکا" },
  { value: "divar", label: "چت دیوار" },
  { value: "sheypoor", label: "چت شیپور" },
  { value: "other", label: "سایر" },
];

export function channelLabel(channel: QuoteChannel) {
  return QUOTE_CHANNELS.find((item) => item.value === channel)?.label ?? channel;
}

export function channelContactMeta(channel: QuoteChannel) {
  const map: Record<QuoteChannel, { label: string; placeholder: string }> = {
    phone: { label: "راه تماس دیگر", placeholder: "مثلاً شماره ثابت یا داخلی" },
    whatsapp: { label: "لینک یا شماره واتساپ", placeholder: "wa.me/... یا شماره دیگر" },
    instagram: { label: "شناسه اینستاگرام", placeholder: "@username" },
    telegram: { label: "شناسه تلگرام", placeholder: "@username یا t.me/..." },
    inPerson: { label: "نشانی / شعبه", placeholder: "مثلاً شعبه ونک" },
    web: { label: "لینک صفحه", placeholder: "https://..." },
    sms: { label: "شماره پیامک", placeholder: "شماره یا سرشماره" },
    email: { label: "ایمیل", placeholder: "name@example.com" },
    bale: { label: "شناسه بله", placeholder: "شناسه یا لینک" },
    eitaa: { label: "شناسه ایتا", placeholder: "شناسه یا لینک" },
    rubika: { label: "شناسه روبیکا", placeholder: "شناسه یا لینک" },
    divar: { label: "آگهی یا شناسه دیوار", placeholder: "لینک آگهی یا نام کاربری" },
    sheypoor: { label: "آگهی یا شناسه شیپور", placeholder: "لینک آگهی یا نام کاربری" },
    other: { label: "مرجع استعلام", placeholder: "هر شناسه یا لینکی که بعداً لازم داری" },
  };
  return map[channel];
}

export function dateToIso(value: Date, endOfDay = false) {
  const date = new Date(value);
  if (endOfDay) date.setHours(23, 59, 59, 999);
  else date.setHours(12, 0, 0, 0);
  return date.toISOString();
}

export function dateFromIso(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatPhone(value?: string | null) {
  const normalized = normalizeOptionalText(value);
  return normalized ? toPersianDigits(normalized) : "—";
}

export function formatUserText(
  value?: string | null,
  fallback = "ثبت نشده"
) {
  const normalized = normalizeOptionalText(value);
  return normalized ? toPersianDigits(normalized) : fallback;
}


export function cleanDisplayText(value?: string | null) {
  const normalized = normalizeOptionalText(value);
  return normalized ? toPersianDigits(normalized) : undefined;
}
