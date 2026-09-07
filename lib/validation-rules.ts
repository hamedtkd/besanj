const EMPTY_TEXT_SENTINELS = new Set(["null", "undefined", "nan"]);

export function normalizeOptionalText(value?: string | null) {
  const normalized = value?.trim();
  if (!normalized) return undefined;
  if (EMPTY_TEXT_SENTINELS.has(normalized.toLocaleLowerCase("en-US"))) {
    return undefined;
  }
  return normalized;
}

function dayStamp(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
}

export function isValidQuoteDateRange(
  quotedAt: Date | string | null | undefined,
  validUntil?: Date | string | null
) {
  if (!quotedAt || !validUntil) return true;
  const start = quotedAt instanceof Date ? quotedAt : new Date(quotedAt);
  const end = validUntil instanceof Date ? validUntil : new Date(validUntil);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return dayStamp(end) >= dayStamp(start);
}
