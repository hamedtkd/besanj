import { normalizeIranPhone } from "./iranian-mobile.ts";
import { normalizeOptionalText } from "./validation-rules.ts";

export interface FollowUpMessageInput {
  caseTitle: string;
  providerName?: string;
  quotedPriceToman?: number | null;
  validUntil?: string | null;
}

export interface ProviderContactLinks {
  normalizedPhone?: string;
  callHref?: string;
  smsHref?: string;
  whatsappHref?: string;
}

function persianNumber(value: number) {
  return new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(
    Math.round(value)
  );
}

function displayCalendarDate(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function buildFollowUpMessage(input: FollowUpMessageInput) {
  const caseTitle = normalizeOptionalText(input.caseTitle) ?? "این خرید";
  const providerName = normalizeOptionalText(input.providerName);
  const lines = [
    providerName ? `سلام ${providerName}،` : "سلام،",
    `برای «${caseTitle}» مزاحم شدم.`,
  ];

  if (
    input.quotedPriceToman !== null &&
    input.quotedPriceToman !== undefined &&
    Number.isFinite(input.quotedPriceToman)
  ) {
    lines.push(
      `آخرین قیمت ثبت‌شده ${persianNumber(input.quotedPriceToman)} تومان بوده.`
    );
  }

  const validUntil = displayCalendarDate(input.validUntil);
  if (validUntil) lines.push(`اعتبار این قیمت تا ${validUntil} ثبت شده.`);

  lines.push("لطفاً اگر قیمت یا شرایط تغییر کرده، خبرم کنید. ممنون.");
  return lines.join("\n");
}

export function buildProviderContactLinks(
  phone: string | null | undefined,
  message?: string
): ProviderContactLinks {
  const normalized = normalizeIranPhone(phone);
  if (!/^\d{7,15}$/.test(normalized)) return {};

  const encodedMessage = message ? encodeURIComponent(message) : undefined;
  const result: ProviderContactLinks = {
    normalizedPhone: normalized,
    callHref: `tel:${normalized}`,
  };

  if (/^09\d{9}$/.test(normalized)) {
    result.smsHref = encodedMessage
      ? `sms:${normalized}?body=${encodedMessage}`
      : `sms:${normalized}`;
    const international = `98${normalized.slice(1)}`;
    result.whatsappHref = encodedMessage
      ? `https://wa.me/${international}?text=${encodedMessage}`
      : `https://wa.me/${international}`;
  }

  return result;
}
