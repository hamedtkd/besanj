import type * as React from "react";
import { cn } from "@/lib/utils";

/** Copied from PersianLabs/ui with Poolamkoo-like radius and spacing. */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full resize-y rounded-xl border border-input bg-transparent px-3 py-2.5 text-base leading-7 transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/20",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
