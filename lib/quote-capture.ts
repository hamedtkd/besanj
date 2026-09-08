import { normalizeIranPhone } from "./iranian-mobile.ts";
import { normalizePersianDigits } from "./normalize-persian-digits.ts";
import type { QuoteChannel } from "./types.ts";

export interface QuoteCaptureDraft {
  providerName?: string;
  phone?: string;
  priceToman?: number;
  extraCostToman?: number;
  deliveryDays?: number;
  warranty?: string;
  paymentTerms?: string;
  channel?: QuoteChannel;
  contactRef?: string;
  validForDays?: number;
  warnings: string[];
  detectedFields: string[];
}

const CHANNEL_KEYWORDS: Array<{ channel: QuoteChannel; needles: string[] }> = [
  { channel: "whatsapp", needles: ["واتساپ", "whatsapp", "wa.me/"] },
  { channel: "instagram", needles: ["اینستاگرام", "دایرکت", "instagram.com"] },
  { channel: "telegram", needles: ["تلگرام", "telegram", "t.me/"] },
  { channel: "bale", needles: ["بله"] },
  { channel: "eitaa", needles: ["ایتا", "eitaa"] },
  { channel: "rubika", needles: ["روبیکا", "rubika"] },
  { channel: "divar", needles: ["دیوار", "divar"] },
  { channel: "sheypoor", needles: ["شیپور", "sheypoor"] },
  { channel: "sms", needles: ["پیامک", "sms"] },
  { channel: "email", needles: ["ایمیل", "email", "@"] },
  { channel: "web", needles: ["سایت", "وب", "http://", "https://"] },
  { channel: "inPerson", needles: ["حضوری", "شعبه"] },
  { channel: "phone", needles: ["تماس", "تلفن"] },
];

function cleanLine(value: string) {
  return value
    .replace(/[\u200c\u200f\u202a-\u202e]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanNumericToken(value: string) {
  return normalizePersianDigits(value)
    .replace(/[٬,،\s]/g, "")
    .replace(/[^\d.]/g, "");
}

function parseAmount(rawNumber: string, scale?: string, unit?: string) {
  const normalized = cleanNumericToken(rawNumber);
  const number = Number(normalized);
  if (!Number.isFinite(number) || number <= 0) return undefined;

  let value = number;
  const scaleText = scale?.toLocaleLowerCase("fa-IR");
  if (scaleText === "میلیون") value *= 1_000_000;
  if (scaleText === "هزار") value *= 1_000;

  const unitText = unit?.toLocaleLowerCase("fa-IR");
  if (unitText === "ریال") value /= 10;

  if (!Number.isFinite(value) || value <= 0) return undefined;
  return Math.round(value);
}

function amountCandidates(text: string) {
  const normalized = normalizePersianDigits(text);
  const rows: Array<{ value: number; index: number }> = [];
  const pattern = /((?:\d{1,3}(?:[\s,٬،]\d{3})+|\d+(?:\.\d+)?))\s*(میلیون|هزار)?\s*(تومان|تومن|ریال)/gi;
  for (const match of normalized.matchAll(pattern)) {
    const value = parseAmount(match[1], match[2], match[3]);
    if (value) rows.push({ value, index: match.index ?? 0 });
  }
  return rows;
}

function labeledAmount(text: string, labels: string[]) {
  const normalized = normalizePersianDigits(text);
  const escaped = labels.join("|");
  const pattern = new RegExp(
    `(?:${escaped})\\s*[:：-]?\\s*((?:\\d{1,3}(?:[\\s,٬،]\\d{3})+|\\d+(?:\\.\\d+)?))\\s*(میلیون|هزار)?\\s*(تومان|تومن|ریال)?`,
    "i"
  );
  const match = pattern.exec(normalized);
  if (!match) return undefined;
  return parseAmount(match[1], match[2], match[3]);
}

function labeledText(lines: string[], labels: string[]) {
  for (const line of lines) {
    for (const label of labels) {
      const index = line.indexOf(label);
      if (index < 0) continue;
      const tail = line
        .slice(index + label.length)
        .replace(/^[\s:：\-–—]+/, "")
        .trim();
      if (tail) return tail;
    }
  }
  return undefined;
}

function detectProvider(lines: string[]) {
  for (const line of lines) {
    const labeled = /^(?:فروشنده|نام فروشنده|ارائه‌دهنده)\s*[:：-]\s*(.+)$/i.exec(line)?.[1];
    if (labeled && labeled.length <= 100 && !/\d{6,}/.test(labeled)) return labeled;
    if (/^(?:فروشگاه|شرکت|مرکز)\s+\S+/i.test(line) && line.length <= 100 && !/\d{6,}/.test(line)) {
      return line;
    }
  }

  const first = lines.find(
    (line) =>
      line.length >= 2 &&
      line.length <= 80 &&
      !/(قیمت|مبلغ|تومان|ریال|تحویل|گارانتی|پرداخت|اعتبار|09\d)/i.test(line)
  );
  return first;
}

function detectPhone(text: string) {
  const normalized = normalizePersianDigits(text);
  const matches = normalized.match(/(?:\+98|0098|98|0)?9[\d\s().-]{9,17}/g) ?? [];
  for (const raw of matches) {
    const phone = normalizeIranPhone(raw);
    if (/^09\d{9}$/.test(phone)) return phone;
  }
  return undefined;
}

function detectDelivery(text: string) {
  const normalized = normalizePersianDigits(text);
  if (/تحویل\s*(?:فوری|همان\s*روز|همون\s*روز)/i.test(normalized)) return 0;
  const match = /تحویل(?:\s*[:：-]?\s*|\s+حدود\s+)(\d{1,3})\s*روز/i.exec(normalized);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function detectValidityDays(text: string) {
  const normalized = normalizePersianDigits(text);
  if (/اعتبار[^\n]{0,20}(?:همان\s*روز|همون\s*روز|امروز)/i.test(normalized)) return 0;
  if (/اعتبار[^\n]{0,20}فردا/i.test(normalized)) return 1;
  if (/اعتبار[^\n]{0,20}(?:یک|1)\s*هفته/i.test(normalized)) return 7;
  if (/اعتبار[^\n]{0,20}(?:دو|2)\s*هفته/i.test(normalized)) return 14;
  const match = /اعتبار[^\n]{0,24}?(\d{1,3})\s*روز/i.exec(normalized);
  if (!match) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
}

function detectChannel(text: string): QuoteChannel | undefined {
  const haystack = text.toLocaleLowerCase("fa-IR");
  return CHANNEL_KEYWORDS.find((entry) =>
    entry.needles.some((needle) => haystack.includes(needle.toLocaleLowerCase("fa-IR")))
  )?.channel;
}

function detectContactRef(text: string, channel?: QuoteChannel) {
  if (channel === "instagram" || channel === "telegram") {
    const handle = /(^|\s)(@[a-zA-Z0-9_.]{3,})\b/.exec(text)?.[2];
    if (handle) return handle;
  }
  const url = /(https?:\/\/[^\s]+)/i.exec(text)?.[1];
  return url?.replace(/[),.;]+$/, "");
}

function pushField(rows: string[], value: unknown, label: string) {
  if (value !== undefined && value !== null && value !== "") rows.push(label);
}

export function parseQuoteCapture(input: string): QuoteCaptureDraft {
  const text = input.trim();
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const warnings: string[] = [];
  const detectedFields: string[] = [];

  if (!text) return { warnings: [], detectedFields: [] };

  const providerName = detectProvider(lines);
  const phone = detectPhone(text);
  const allAmounts = amountCandidates(text);
  const explicitPrice = labeledAmount(text, ["قیمت", "مبلغ", "جمع"]);
  const extraCostToman = labeledAmount(text, ["هزینه ارسال", "ارسال", "هزینه نصب", "نصب", "هزینه جانبی"]);
  const priceCandidates = allAmounts.filter((row) => row.value !== extraCostToman);
  const priceToman = explicitPrice ?? priceCandidates[0]?.value;

  if (!explicitPrice && priceCandidates.length > 1) {
    warnings.push("چند مبلغ در متن پیدا شد؛ مبلغ اول در فرم قرار گرفت و بهتر است قیمت را بررسی کنی.");
  }

  const deliveryDays = detectDelivery(text);
  const validForDays = detectValidityDays(text);
  const warranty = labeledText(lines, ["گارانتی", "ضمانت"]);
  const paymentTerms = labeledText(lines, ["شرایط پرداخت", "پرداخت"]);
  const channel = detectChannel(text);
  const contactRef = detectContactRef(text, channel);

  pushField(detectedFields, providerName, "فروشنده");
  pushField(detectedFields, phone, "موبایل");
  pushField(detectedFields, priceToman, "قیمت");
  pushField(detectedFields, extraCostToman, "هزینه جانبی");
  pushField(detectedFields, deliveryDays, "تحویل");
  pushField(detectedFields, validForDays, "اعتبار قیمت");
  pushField(detectedFields, warranty, "گارانتی");
  pushField(detectedFields, paymentTerms, "پرداخت");
  pushField(detectedFields, channel, "روش استعلام");
  pushField(detectedFields, contactRef, "مرجع تماس");

  if (!priceToman) {
    warnings.push("قیمت قابل اتکایی پیدا نشد؛ مبلغ را دستی وارد کن.");
  }

  return {
    providerName,
    phone,
    priceToman,
    extraCostToman,
    deliveryDays,
    warranty,
    paymentTerms,
    channel,
    contactRef,
    validForDays,
    warnings,
    detectedFields,
  };
}
