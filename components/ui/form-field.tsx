import type * as React from "react";
import { HelpHint } from "@/components/help-hint";
import {
  Field,
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
      <div className="flex items-center gap-1.5">
        <FieldLabel>
          {label}
          {required ? <span className="text-destructive">*</span> : null}
        </FieldLabel>
        {hint ? <HelpHint label={`راهنمای ${label}`}>{hint}</HelpHint> : null}
      </div>
      {children}
      {error ? <FieldError match={true}>{error}</FieldError> : null}
    </Field>
  );
}
