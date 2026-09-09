import {
  PERSIAN_DATE_LOCALE,
  PERSIAN_GREGORIAN_DATE_LOCALE,
  toPersianDigits,
} from "./persian-number.ts";

export { toPersianDigits } from "./persian-number.ts";

export type CalendarType = "shamsi" | "miladi";

function dateParts(date: Date, calendarType: CalendarType) {
  const locale =
    calendarType === "shamsi"
      ? PERSIAN_DATE_LOCALE
      : PERSIAN_GREGORIAN_DATE_LOCALE;
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function formatPersianPickerDate(
  date: Date,
  calendarType: CalendarType = "shamsi"
) {
  const { year, month, day } = dateParts(date, calendarType);
  return toPersianDigits(`${year}/${month}/${day}`);
}
