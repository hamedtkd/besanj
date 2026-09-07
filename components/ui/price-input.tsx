"use client";

import type * as React from "react";
import { Input } from "@/components/ui/input";
import { useControllableState } from "@/hooks/use-controllable-state";
import { normalizePersianDigits } from "@/lib/normalize-persian-digits";
import { cn } from "@/lib/utils";

export interface PriceInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "type"
> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
  locale?: Intl.LocalesArgument;
}

function clamp(value: number, min?: number, max?: number) {
  let next = value;
  if (min !== undefined) next = Math.max(next, min);
  if (max !== undefined) next = Math.min(next, max);
  return next;
}

function formatValue(value: number | null, locale: Intl.LocalesArgument) {
  if (value === null) return "";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

function isDigit(char: string) {
  return /[0-9۰-۹٠-٩]/.test(char);
}

function countDigits(text: string) {
  return [...text].filter(isDigit).length;
}

function offsetAfterDigitCount(text: string, digitCount: number) {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < text.length; i++) {
    if (isDigit(text.charAt(i))) {
      seen++;
      if (seen === digitCount) return i + 1;
    }
  }
  return text.length;
}

function extendDeletionToDigit(
  raw: string,
  cursor: number,
  direction: "forward" | "backward"
) {
  if (direction === "forward") {
    const after = raw.slice(cursor);
    const relativeIndex = after.search(/\d/);
    if (relativeIndex === -1) return raw;
    const index = cursor + relativeIndex;
    return raw.slice(0, index) + raw.slice(index + 1);
  }
  const before = raw.slice(0, cursor);
  const digitMatches = [...before.matchAll(/\d/g)];
  const lastDigit = digitMatches.at(-1);
  if (!lastDigit || lastDigit.index === undefined) return raw;
  return raw.slice(0, lastDigit.index) + raw.slice(lastDigit.index + 1);
}

/** PersianLabs/ui PriceInput with caret-safe live thousands grouping. */
function PriceInput({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  locale = "fa-IR-u-nu-arabext",
  placeholder = "۰",
  className,
  onBlur,
  ...props
}: PriceInputProps) {
  const [numericValue, setNumericValue] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: "PriceInput",
  });

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const input = event.target;
    const cursor = input.selectionStart ?? input.value.length;
    let raw = normalizePersianDigits(input.value);
    const inputType = (event.nativeEvent as InputEvent).inputType;
    const previousDigitCount =
      numericValue === null ? 0 : String(Math.abs(numericValue)).length;
    let digits = raw.replace(/\D/g, "");

    if (
      (inputType === "deleteContentForward" || inputType === "deleteContentBackward") &&
      digits.length === previousDigitCount
    ) {
      raw = extendDeletionToDigit(
        raw,
        cursor,
        inputType === "deleteContentForward" ? "forward" : "backward"
      );
      digits = raw.replace(/\D/g, "");
    }

    const digitsBeforeCursor = countDigits(raw.slice(0, cursor));
    const negative =
      min === undefined || min < 0 ? raw.trimStart().startsWith("-") : false;

    if (!digits) {
      setNumericValue(null);
      return;
    }

    const nextValue = (negative ? -1 : 1) * Number(digits);
    const formatted = formatValue(nextValue, locale);
    if (formatted !== input.value) {
      const nextPos = offsetAfterDigitCount(formatted, digitsBeforeCursor);
      input.value = formatted;
      input.setSelectionRange(nextPos, nextPos);
    }
    setNumericValue(nextValue);
  }

  function handleBlur(event: React.FocusEvent<HTMLInputElement>) {
    if (numericValue !== null) {
      const clamped = clamp(numericValue, min, max);
      if (clamped !== numericValue) setNumericValue(clamped);
    }
    onBlur?.(event);
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode={min !== undefined && min >= 0 ? "numeric" : "text"}
      dir="ltr"
      value={formatValue(numericValue, locale)}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={cn("type-data text-left", className)}
    />
  );
}

export { PriceInput };
