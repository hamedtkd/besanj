"use client";

import { CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function HelpHint({
  children,
  label = "راهنما",
  side = "top",
  className,
  contentClassName,
}: {
  children: React.ReactNode;
  label?: string;
  side?: "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={label}
            className={cn(
              "size-7 rounded-full text-muted-foreground hover:text-foreground",
              className
            )}
            data-help-hint
          >
            <CircleHelp className="size-4" />
          </Button>
        }
      />
      <TooltipContent
        side={side}
        className={cn("max-w-80 text-right leading-6", contentClassName)}
      >
        {children}
      </TooltipContent>
    </Tooltip>
  );
}
