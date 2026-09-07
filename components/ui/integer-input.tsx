"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { normalizePersianDigits } from "@/lib/normalize-persian-digits";
import { toPersianDigits } from "@/lib/persian-date";
import { cn } from "@/lib/utils";

export interface IntegerInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "defaultValue" | "onChange" | "type"
> {
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number | null) => void;
  min?: number;
  max?: number;
}

function clamp(value: number, min?: number, max?: number) {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

/** Numeric text input that stores a number but always displays Persian digits. */
export function IntegerInput({
  value,
  defaultValue = null,
  onValueChange,
  min,
  max,
  placeholder = "",
  className,
  onBlur,
  ...props
}: IntegerInputProps) {
  const controlled = value !== undefined;
  const [internal, setInternal] = React.useState<number | null>(defaultValue);
  const current = controlled ? value : internal;

  function setValue(next: number | null) {
    if (!controlled) setInternal(next);
    onValueChange?.(next);
  }

  return (
    <Input
      {...props}
      type="text"
      inputMode="numeric"
      dir="ltr"
      value={current === null ? "" : toPersianDigits(String(current))}
      placeholder={placeholder}
      onChange={(event) => {
        const digits = normalizePersianDigits(event.target.value).replace(/\D/g, "");
        if (!digits) {
          setValue(null);
          return;
        }
        const numeric = Number(digits);
        setValue(Number.isFinite(numeric) ? numeric : null);
      }}
      onBlur={(event) => {
        if (current !== null) {
          const next = clamp(current, min, max);
          if (next !== current) setValue(next);
        }
        onBlur?.(event);
      }}
      className={cn("type-data text-left", className)}
    />
  );
}
