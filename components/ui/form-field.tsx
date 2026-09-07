import type * as React from "react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

/** Product wrapper around PersianLabs/ui Field. */
export function FormField({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Field data-invalid={Boolean(error) || undefined} className={cn("gap-2", className)}>
      <FieldLabel>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </FieldLabel>
      {children}
      {error ? <FieldError match={true}>{error}</FieldError> : hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  );
}
