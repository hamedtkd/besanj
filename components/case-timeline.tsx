"use client";

import * as React from "react";
import {
  BellRing,
  CheckCircle2,
  FileText,
  FolderPlus,
  ReceiptText,
  Store,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { buildCaseTimeline, type CaseTimelineKind } from "@/lib/case-report";
import { formatPersianDateTime } from "@/lib/format";
import type {
  CaseReminder,
  Provider,
  PurchaseCase,
  Quote,
  QuoteAttachment,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type TimelineFilter = "all" | "quote" | "reminder" | "attachment" | "decision";

const FILTERS: Array<{ value: TimelineFilter; label: string }> = [
  { value: "all", label: "همه" },
  { value: "quote", label: "استعلام‌ها" },
  { value: "reminder", label: "پیگیری‌ها" },
  { value: "attachment", label: "فایل‌ها" },
  { value: "decision", label: "تصمیم" },
];

export function CaseTimeline({
  purchaseCase,
  providers,
  quotes,
  reminders,
  attachments,
}: {
  purchaseCase: PurchaseCase;
  providers: Provider[];
  quotes: Quote[];
  reminders: CaseReminder[];
  attachments: QuoteAttachment[];
}) {
  const [filter, setFilter] = React.useState<TimelineFilter>("all");
  const timeline = buildCaseTimeline(
    purchaseCase,
    providers,
    quotes,
    reminders,
    attachments
  );
  const visible =
    filter === "all"
      ? timeline
      : timeline.filter((item) => item.kind === filter);

  return (
    <div className="space-y-3">
      <Card className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ReceiptText className="size-4.5 text-primary" />
              <h2 className="type-section-title">خط زمانی پرونده</h2>
              <Badge variant="secondary">{timeline.length.toLocaleString("fa-IR")}</Badge>
            </div>
            <p className="type-caption mt-1 text-muted-foreground">
              استعلام، پیگیری، فایل و انتخاب فعلی را به ترتیب زمان کنار هم می‌بینی.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((item) => (
              <Button
                key={item.value}
                type="button"
                size="sm"
                variant={filter === item.value ? "secondary" : "ghost"}
                aria-pressed={filter === item.value}
                onClick={() => setFilter(item.value)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {visible.length ? (
        <div className="relative ms-4 border-s border-border ps-5 sm:ms-5 sm:ps-6">
          <div className="grid gap-3">
            {visible.map((item) => (
              <div key={item.id} className="relative">
                <span
                  className={cn(
                    "absolute -start-[2.18rem] top-4 grid size-8 place-items-center rounded-full border border-border bg-background text-muted-foreground shadow-sm sm:-start-[2.43rem]",
                    item.kind === "decision" &&
                      "border-primary/35 bg-primary/10 text-primary"
                  )}
                >
                  <TimelineIcon kind={item.kind} />
                </span>
                <Card className="p-3.5 sm:p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                    <div className="min-w-0">
                      <div className="type-label">{item.title}</div>
                      {item.detail ? (
                        <p className="type-caption mt-1 text-muted-foreground">
                          {item.detail}
                        </p>
                      ) : null}
                    </div>
                    <time className="type-caption shrink-0 text-muted-foreground">
                      {formatPersianDateTime(item.at)}
                    </time>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card className="border-dashed p-8 text-center text-muted-foreground">
          <p className="type-body">در این دسته هنوز رویدادی ثبت نشده است.</p>
        </Card>
      )}
    </div>
  );
}

function TimelineIcon({ kind }: { kind: CaseTimelineKind }) {
  if (kind === "quote") return <ReceiptText className="size-3.5" />;
  if (kind === "reminder") return <BellRing className="size-3.5" />;
  if (kind === "attachment") return <FileText className="size-3.5" />;
  if (kind === "decision") return <CheckCircle2 className="size-3.5" />;
  if (kind === "provider") return <Store className="size-3.5" />;
  return <FolderPlus className="size-3.5" />;
}
