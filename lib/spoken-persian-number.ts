import { normalizePersianDigits } from "./normalize-persian-digits.ts";

const SMALL_VALUES: Record<string, number> = {
  صفر: 0,
  یک: 1,
  يه: 1,
  یه: 1,
  دو: 2,
  سه: 3,
  چهار: 4,
  پنج: 5,
  شش: 6,
  هفت: 7,
  هشت: 8,
  نه: 9,
  ده: 10,
  یازده: 11,
  دوازده: 12,
  سیزده: 13,
  چهارده: 14,
  پانزده: 15,
  شانزده: 16,
  هفده: 17,
  هجده: 18,
  نوزده: 19,
  بیست: 20,
  سی: 30,
  چهل: 40,
  پنجاه: 50,
  شصت: 60,
  هفتاد: 70,
  هشتاد: 80,
  نود: 90,
  صد: 100,
  یکصد: 100,
  دویست: 200,
  سیصد: 300,
  چهارصد: 400,
  پانصد: 500,
  ششصد: 600,
  هفتصد: 700,
  هشتصد: 800,
  نهصد: 900,
  نیم: 0.5,
};

const SCALE_VALUES: Record<string, number> = {
  هزار: 1_000,
  میلیون: 1_000_000,
  میلیارد: 1_000_000_000,
};

const DIGIT_WORDS: Record<string, string> = {
  صفر: "0",
  یک: "1",
  يه: "1",
  یه: "1",
  دو: "2",
  سه: "3",
  چهار: "4",
  پنج: "5",
  شش: "6",
  هفت: "7",
  هشت: "8",
  نه: "9",
};

function normalizeWord(value: string) {
  return value
    .trim()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200f\u202a-\u202e]/g, "")
    .replace(/[،,؛;:.!?؟()\[\]{}"']/g, "")
    .trim();
}

export function parsePersianNumberWords(input: string): number | undefined {
  const normalizedDigits = normalizePersianDigits(input);
  if (/^[\s+-]*\d+(?:\.\d+)?[\s]*$/.test(normalizedDigits)) {
    const direct = Number(normalizedDigits.trim());
    return Number.isFinite(direct) ? direct : undefined;
  }

  const tokens = normalizedDigits
    .replace(/\s+/g, " ")
    .split(" ")
    .map(normalizeWord)
    .filter(Boolean)
    .filter((token) => token !== "و");

  if (!tokens.length) return undefined;

  let total = 0;
  let current = 0;
  let recognized = 0;

  for (const token of tokens) {
    if (/^\d+(?:\.\d+)?$/.test(token)) {
      current += Number(token);
      recognized += 1;
      continue;
    }

    if (Object.hasOwn(SMALL_VALUES, token)) {
      current += SMALL_VALUES[token];
      recognized += 1;
      continue;
    }

    const scale = SCALE_VALUES[token];
    if (scale) {
      total += (current || 1) * scale;
      current = 0;
      recognized += 1;
      continue;
    }

    return undefined;
  }

  if (!recognized) return undefined;
  const value = total + current;
  return Number.isFinite(value) ? value : undefined;
}

export function parseSpokenDigitSequence(input: string) {
  const tokens = normalizePersianDigits(input)
    .replace(/[،,؛;:.!?؟()\[\]{}"']/g, " ")
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean)
    .filter((token) => token !== "و");

  if (!tokens.length) return undefined;

  let output = "";
  let recognized = 0;
  for (const token of tokens) {
    if (/^\d+$/.test(token)) {
      output += token;
      recognized += 1;
      continue;
    }
    const digit = DIGIT_WORDS[token];
    if (digit === undefined) return undefined;
    output += digit;
    recognized += 1;
  }

  return recognized ? output : undefined;
}


export function findSpokenDigitSequence(input: string, minDigits = 11) {
  const tokens = normalizePersianDigits(input)
    .replace(/[،,؛;:.!?؟()\[\]{}"']/g, " ")
    .split(/\s+/)
    .map(normalizeWord)
    .filter(Boolean);

  let current = "";

  function flush() {
    const candidate = current;
    current = "";
    return candidate.length >= minDigits ? candidate : undefined;
  }

  for (const token of tokens) {
    if (token === "و" && current) continue;
    if (/^\d+$/.test(token)) {
      current += token;
      continue;
    }
    const digit = DIGIT_WORDS[token];
    if (digit !== undefined) {
      current += digit;
      continue;
    }
    const found = flush();
    if (found) return found;
  }

  return flush();
}

export const PERSIAN_SIMPLE_NUMBER_WORD_PATTERN = [
  ...Object.keys(SMALL_VALUES),
  "و",
]
  .sort((left, right) => right.length - left.length)
  .join("|");

export const PERSIAN_NUMBER_WORD_PATTERN = [
  ...Object.keys(SMALL_VALUES),
  ...Object.keys(SCALE_VALUES),
  "و",
]
  .sort((left, right) => right.length - left.length)
  .join("|");
