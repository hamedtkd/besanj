export type CalendarType = "shamsi" | "miladi";

export function toPersianDigits(value: string | number) {
  return String(value).replace(
    /\d/g,
    (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit
  );
}

function dateParts(date: Date, calendarType: CalendarType) {
  const locale =
    calendarType === "shamsi"
      ? "fa-IR-u-ca-persian-nu-arabext"
      : "fa-IR-u-ca-gregory-nu-arabext";
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
  return `${year}/${month}/${day}`;
}
