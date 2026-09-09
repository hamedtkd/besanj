export const PERSIAN_NUMBER_LOCALE = "fa-IR-u-nu-arabext";
export const PERSIAN_DATE_LOCALE = "fa-IR-u-ca-persian-nu-arabext";
export const PERSIAN_GREGORIAN_DATE_LOCALE = "fa-IR-u-ca-gregory-nu-arabext";

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

/**
 * Converts Latin and Arabic-Indic digits to Persian digits while leaving
 * the rest of the text untouched. This is the final display boundary for
 * user-visible identifiers such as phone numbers and mixed text.
 */
export function toPersianDigits(value: string | number) {
  return String(value)
    .replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)] ?? digit)
    .replace(/[٠-٩]/g, (digit) => {
      const index = ARABIC_INDIC_DIGITS.indexOf(digit);
      return index >= 0 ? PERSIAN_DIGITS[index] : digit;
    });
}

export function formatPersianNumber(
  value: number,
  options: Intl.NumberFormatOptions = {}
) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(PERSIAN_NUMBER_LOCALE, options).format(value);
}

export function formatPersianInteger(value: number) {
  return formatPersianNumber(Math.round(value), { maximumFractionDigits: 0 });
}

export function formatPersianDecimal(
  value: number,
  maximumFractionDigits = 1
) {
  return formatPersianNumber(value, {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  });
}

/** Accepts a whole percent value, for example 37.5 -> ۳۷٫۵٪. */
export function formatPersianPercent(
  value: number,
  maximumFractionDigits = 1
) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(PERSIAN_NUMBER_LOCALE, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(value / 100);
}
