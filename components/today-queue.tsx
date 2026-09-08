"use client";

import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  Check,
  CircleAlert,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { setReminderDone } from "@/lib/db";
import type { DashboardTask } from "@/lib/follow-up";
import { cn } from "@/lib/utils";

const iconByKind = {
  reminder: BellRing,
  expiring: CalendarClock,
  stale: RefreshCw,
  ready: Sparkles,
} as const;

export function TodayQueue({ tasks }: { tasks: DashboardTask[] }) {
  if (!tasks.length) return null;
  const visible = tasks.slice(0, 5);

  return (
    <Card className="mb-6 overflow-hidden border-primary/20 bg-card/82 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border/85 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <BellRing className="size-4" />
            </span>
            <h2 className="type-section-title">کارهای امروز</h2>
            <Badge variant={tasks.some((item) => item.priority === "urgent") ? "warning" : "secondary"}>
              {tasks.length.toLocaleString("fa-IR")}
            </Badge>
          </div>
          <p className="type-caption mt-1 text-muted-foreground">
            پیگیری‌های سررسیدشده، قیمت‌های رو به انقضا و پرونده‌های آماده تصمیم اینجا جمع می‌شوند.
          </p>
        </div>
      </div>

      <div className="divide-y divide-border/75">
        {visible.map((task) => {
          const Icon = iconByKind[task.kind];
          return (
            <div key={task.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
              <span
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-xl",
                  task.priority === "urgent"
                    ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
                    : task.kind === "ready"
                      ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                      : "bg-primary/10 text-primary"
                )}
              >
                {task.priority === "urgent" && task.kind !== "reminder" ? (
                  <CircleAlert className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>

              <Link href={`/cases/${task.caseId}`} className="min-w-0 flex-1 rounded-lg focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/30">
                <div className="type-label truncate">{task.title}</div>
                <div className="type-caption mt-0.5 truncate text-muted-foreground">{task.detail}</div>
              </Link>

              {task.reminderId ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => void setReminderDone(task.reminderId!, true)}
                >
                  <Check />
                  <span className="hidden sm:inline">انجام شد</span>
                </Button>
              ) : (
                <Button
                  nativeButton={false}
                  render={<Link href={`/cases/${task.caseId}`} />}
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                >
                  باز کردن
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {tasks.length > visible.length ? (
        <div className="border-t border-border/75 bg-muted/20 px-4 py-2.5 text-center sm:px-5">
          <span className="type-caption text-muted-foreground">
            {`و ${(tasks.length - visible.length).toLocaleString("fa-IR")} مورد دیگر`}
          </span>
        </div>
      ) : null}
    </Card>
  );
}
