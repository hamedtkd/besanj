import { normalizeIranPhone } from "./iranian-mobile.ts";
import { normalizePersianDigits } from "./normalize-persian-digits.ts";
import { parseQuickToman } from "./quick-capture.ts";
import {
  PERSIAN_SIMPLE_NUMBER_WORD_PATTERN,
  findSpokenDigitSequence,
  parsePersianNumberWords,
  parseSpokenDigitSequence,
} from "./spoken-persian-number.ts";
import type { QuoteChannel } from "./types.ts";

export type QuoteAvailability = "available" | "unavailable" | "preorder";

export interface QuoteCaptureDraft {
  subjectTitle?: string;
  providerName?: string;
  phone?: string;
  priceToman?: number;
  extraCostToman?: number;
  deliveryDays?: number;
  warranty?: string;
  paymentTerms?: string;
  availability?: QuoteAvailability;
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
  if (scaleText === "میلیارد") value *= 1_000_000_000;
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
  const currencyPattern = /((?:\d{1,3}(?:[\s,٬،]\d{3})+|\d+(?:\.\d+)?))\s*(میلیارد|میلیون|هزار)?\s*(تومان|تومن|ریال)/gi;
  for (const match of normalized.matchAll(currencyPattern)) {
    const value = parseAmount(match[1], match[2], match[3]);
    if (value) rows.push({ value, index: match.index ?? 0 });
  }

  const scaledNumberPattern = /(\d+(?:\.\d+)?)\s*(میلیارد|میلیون|هزار)(?:\s*(تومان|تومن|ریال))?/gi;
  for (const match of normalized.matchAll(scaledNumberPattern)) {
    const value = parseAmount(match[1], match[2], match[3]);
    if (value && !rows.some((row) => row.value === value && row.index === (match.index ?? 0))) {
      rows.push({ value, index: match.index ?? 0 });
    }
  }

  const spokenPattern = new RegExp(
    `((?:(?:${PERSIAN_SIMPLE_NUMBER_WORD_PATTERN})\\s*){1,12})(میلیارد|میلیون|هزار)(?:\\s*(تومان|تومن|ریال))?`,
    "gi"
  );
  for (const match of normalized.matchAll(spokenPattern)) {
    const base = parsePersianNumberWords(match[1]);
    if (base === undefined || base <= 0) continue;
    const value = parseAmount(String(base), match[2], match[3]);
    if (value && !rows.some((row) => row.value === value && row.index === (match.index ?? 0))) {
      rows.push({ value, index: match.index ?? 0 });
    }
  }


  return rows.sort((left, right) => left.index - right.index);
}

function labeledAmount(text: string, labels: string[]) {
  const normalized = normalizePersianDigits(text);
  const escaped = labels.join("|");
  const numericPattern = new RegExp(
    `(?:${escaped})\\s*[:：-]?\\s*((?:\\d{1,3}(?:[\\s,٬،]\\d{3})+|\\d+(?:\\.\\d+)?))\\s*(میلیارد|میلیون|هزار)?\\s*(تومان|تومن|ریال)?`,
    "i"
  );
  const numericMatch = numericPattern.exec(normalized);
  if (numericMatch) return parseAmount(numericMatch[1], numericMatch[2], numericMatch[3]);

  const lines = normalized.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const tail = labeledText(lines, labels);
  if (!tail) return undefined;
  return parseQuickToman(tail).valueToman;
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

function looksLikeDetailLine(line: string) {
  return /^(?:قیمت|مبلغ|جمع|موبایل|شماره|تلفن|تحویل|ارسال|گارانتی|ضمانت|پرداخت|شرایط پرداخت|اعتبار|موجود|ناموجود|واتساپ|تلگرام|اینستاگرام|سایت|وب)\b/i.test(
    line
  );
}

function looksLikeProviderLine(line: string) {
  return /^(?:فروشنده|نام فروشنده|ارائه‌دهنده)\s*[:：-]|^(?:فروشگاه|شرکت|مرکز)\s+\S+/i.test(line);
}

function detailBoundaryIndex(line: string) {
  const normalized = normalizePersianDigits(line);
  const indices: number[] = [];
  const marker = /\s+(?=(?:قیمت|مبلغ|جمع|موجود|ناموجود|گارانتی|ضمانت|تحویل|ارسال|پرداخت|اعتبار|موبایل|شماره|تلفن))/i.exec(normalized);
  if (marker?.index !== undefined) indices.push(marker.index);
  const firstAmount = amountCandidates(normalized)[0];
  if (firstAmount && firstAmount.index > 0) indices.push(firstAmount.index);
  return indices.length ? Math.min(...indices) : undefined;
}

function cutBeforeDetails(line: string) {
  const boundary = detailBoundaryIndex(line);
  return (boundary === undefined ? line : line.slice(0, boundary)).replace(/[،,؛;:\-]+$/, "").trim();
}

function detectSubjectTitle(lines: string[]) {
  for (const line of lines) {
    if (line.length < 2 || looksLikeProviderLine(line) || looksLikeDetailLine(line)) continue;
    const normalized = normalizePersianDigits(line);
    if (/^(?:\+98|0098|98|0)?9[\d\s().-]{9,17}$/.test(normalized)) continue;

    const candidate = cutBeforeDetails(line);
    if (candidate.length >= 2 && candidate.length <= 120) return candidate;
  }
  return undefined;
}

function detectProvider(lines: string[]) {
  for (const line of lines) {
    const labeled = /^(?:فروشنده|نام فروشنده|ارائه‌دهنده)\s*[:：-]\s*(.+)$/i.exec(line)?.[1];
    if (labeled) {
      const candidate = cutBeforeDetails(labeled);
      if (candidate.length <= 100 && !/\d{6,}/.test(candidate)) return candidate;
    }
    if (/^(?:فروشگاه|شرکت|مرکز)\s+\S+/i.test(line)) {
      const candidate = cutBeforeDetails(line);
      if (candidate.length <= 100 && !/\d{6,}/.test(candidate)) return candidate;
    }
  }
  return undefined;
}

function detectPhone(text: string) {
  const normalized = normalizePersianDigits(text);
  const matches = normalized.match(/(?:\+98|0098|98|0)?9[\d\s().-]{9,17}/g) ?? [];
  for (const raw of matches) {
    const phone = normalizeIranPhone(raw);
    if (/^09\d{9}$/.test(phone)) return phone;
  }

  const spokenLine = normalized
    .split(/\r?\n/)
    .map(cleanLine)
    .find((line) => /^(?:موبایل|شماره|تلفن)\s*[:：-]?\s*/i.test(line));
  if (spokenLine) {
    const tail = spokenLine.replace(/^(?:موبایل|شماره|تلفن)\s*[:：-]?\s*/i, "");
    const digits = parseSpokenDigitSequence(tail);
    if (digits) {
      const phone = normalizeIranPhone(digits);
      if (/^09\d{9}$/.test(phone)) return phone;
    }
  }

  const embeddedDigits = findSpokenDigitSequence(normalized, 11);
  if (embeddedDigits) {
    const phone = normalizeIranPhone(embeddedDigits);
    if (/^09\d{9}$/.test(phone)) return phone;
  }
  return undefined;
}

function detectDelivery(text: string) {
  const normalized = normalizePersianDigits(text);
  if (/(?:تحویل|ارسال)\s*(?:فوری|همان\s*روز|همون\s*روز|امروز)/i.test(normalized)) return 0;
  if (/(?:تحویل|ارسال)[^\n]{0,16}فردا/i.test(normalized)) return 1;
  const match = /(?:تحویل|ارسال)(?:\s*[:：-]?\s*|\s+حدود\s+)(\d{1,3})\s*(?:روز|روزه)/i.exec(normalized);
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

function detectWarranty(_text: string, lines: string[]) {
  const tail = labeledText(lines, ["گارانتی", "ضمانت"]);
  if (!tail) return undefined;
  return tail
    .split(/\s+(?=(?:ارسال|تحویل|موجود|ناموجود|پرداخت|اعتبار|موبایل|شماره|تلفن|واتساپ|تلگرام|اینستاگرام))/i)[0]
    ?.trim();
}

function detectAvailability(text: string): QuoteAvailability | undefined {
  const normalized = text.toLocaleLowerCase("fa-IR");
  if (/ناموجود|موجود\s*نیست|اتمام\s*موجودی/.test(normalized)) return "unavailable";
  if (/پیش[\s‌-]*سفارش|سفارشی/.test(normalized)) return "preorder";
  if (/(?:^|[\s،,.])موجود(?:$|[\s،,.])/.test(normalized)) return "available";
  return undefined;
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

export function availabilityLabel(value?: QuoteAvailability) {
  if (value === "available") return "موجود";
  if (value === "unavailable") return "ناموجود";
  if (value === "preorder") return "سفارشی / پیش‌سفارش";
  return undefined;
}

export function parseQuoteCapture(input: string): QuoteCaptureDraft {
  const text = input.trim();
  const lines = text.split(/\r?\n/).map(cleanLine).filter(Boolean);
  const warnings: string[] = [];
  const detectedFields: string[] = [];

  if (!text) return { warnings: [], detectedFields: [] };

  const subjectTitle = detectSubjectTitle(lines);
  const providerName = detectProvider(lines);
  const phone = detectPhone(text);
  const allAmounts = amountCandidates(text);
  const explicitPrice = labeledAmount(text, ["قیمت", "مبلغ", "جمع", "قیمت نهایی"]);
  const extraCostToman = labeledAmount(text, ["هزینه ارسال", "هزینه نصب", "نصب", "هزینه جانبی"]);
  const priceCandidates = allAmounts.filter((row) => row.value !== extraCostToman);
  const priceToman = explicitPrice ?? priceCandidates[0]?.value;

  if (!explicitPrice && priceCandidates.length > 1) {
    warnings.push("چند مبلغ در متن پیدا شد؛ مبلغ اول پیشنهاد شده و بهتر است قیمت را بررسی کنی.");
  }

  const deliveryDays = detectDelivery(text);
  const validForDays = detectValidityDays(text);
  const warranty = detectWarranty(text, lines);
  const paymentTerms = labeledText(lines, ["شرایط پرداخت", "پرداخت"]);
  const availability = detectAvailability(text);
  const channel = detectChannel(text);
  const contactRef = detectContactRef(text, channel);

  pushField(detectedFields, subjectTitle, "کالا / خدمت");
  pushField(detectedFields, providerName, "فروشنده");
  pushField(detectedFields, phone, "موبایل");
  pushField(detectedFields, priceToman, "قیمت");
  pushField(detectedFields, extraCostToman, "هزینه جانبی");
  pushField(detectedFields, deliveryDays, "تحویل");
  pushField(detectedFields, validForDays, "اعتبار قیمت");
  pushField(detectedFields, warranty, "گارانتی");
  pushField(detectedFields, paymentTerms, "پرداخت");
  pushField(detectedFields, availability, "موجودی");
  pushField(detectedFields, channel, "روش استعلام");
  pushField(detectedFields, contactRef, "مرجع تماس");

  if (!priceToman) {
    warnings.push("قیمت قابل اتکایی پیدا نشد؛ مبلغ را دستی وارد کن.");
  }

  return {
    subjectTitle,
    providerName,
    phone,
    priceToman,
    extraCostToman,
    deliveryDays,
    warranty,
    paymentTerms,
    availability,
    channel,
    contactRef,
    validForDays,
    warnings,
    detectedFields,
  };
}
