import { normalizePersianDigits } from "@/lib/normalize-persian-digits";

/** Adapted from PersianLabs/ui iranian-mobile utility. */
export function normalizeIranPhone(phone: string | null | undefined) {
  let value = normalizePersianDigits(phone ?? "").trim();
  value = value.replace(/[\s\-().]/g, "");
  if (value.startsWith("+98")) value = value.slice(3);
  else if (value.startsWith("0098")) value = value.slice(4);
  else if (value.startsWith("98")) value = value.slice(2);
  if (/^09\d{9}$/.test(value)) return value;
  if (/^9\d{9}$/.test(value)) return `0${value}`;
  return value.replace(/\D/g, "");
}

export function isValidIranPhone(phone: string | null | undefined) {
  return /^09\d{9}$/.test(normalizeIranPhone(phone));
}
