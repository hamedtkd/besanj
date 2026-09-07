"use client";

import * as React from "react";
import { CheckIcon, CircleAlertIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { useControllableState } from "@/hooks/use-controllable-state";
import { isValidIranPhone, normalizeIranPhone } from "@/lib/iranian-mobile";
import { toPersianDigits } from "@/lib/persian-date";
import { cn } from "@/lib/utils";

export interface MobileNumberInputProps extends Omit<
  React.ComponentProps<typeof InputGroupInput>,
  "value" | "defaultValue" | "onChange" | "type" | "dir"
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

/** Copied from PersianLabs/ui Mobile Number Input. */
function MobileNumberInput({
  value,
  defaultValue = "",
  onValueChange,
  className,
  ...props
}: MobileNumberInputProps) {
  const [number, setNumber] = useControllableState({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
    caller: "MobileNumberInput",
  });
  const normalized = normalizeIranPhone(number);
  const complete = normalized.length === 11;
  const valid = complete && isValidIranPhone(normalized);

  return (
    <InputGroup className={cn("h-10", className)} dir="ltr">
      <InputGroupInput
        {...props}
        dir="ltr"
        inputMode="numeric"
        autoComplete="tel"
        spellCheck={false}
        translate="no"
        aria-invalid={complete && !valid}
        value={toPersianDigits(normalized)}
        onChange={(event) =>
          setNumber(normalizeIranPhone(event.target.value).slice(0, 11))
        }
        placeholder="۰۹۱۲ ۱۲۳ ۴۵۶۷"
        className="type-data text-base tracking-wide"
      />
      {complete ? (
        <InputGroupAddon align="inline-end">
          {valid ? (
            <CheckIcon aria-label="شماره موبایل معتبر است" className="size-4 text-profit" />
          ) : (
            <CircleAlertIcon aria-label="شماره موبایل معتبر نیست" className="size-4 text-destructive" />
          )}
        </InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}

export { MobileNumberInput };
