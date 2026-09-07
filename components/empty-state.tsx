import type * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid min-h-64 place-items-center rounded-3xl border border-dashed border-border bg-card/50 p-6 text-center",
        className
      )}
    >
      <div className="mx-auto max-w-sm">
        <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          {icon ?? <Inbox className="size-5" />}
        </div>
        <h3 className="type-section-title">{title}</h3>
        <p className="type-body mt-2 text-muted-foreground">{description}</p>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}
