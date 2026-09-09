"use client";

import * as React from "react";
import Link from "next/link";
import {
  BellRing,
  CalendarClock,
  Check,
  CircleAlert,
  Clock3,
  RefreshCw,
  Sparkles,
  Truck,
} from "lucide-react";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { setReminderDone, snoozeReminder } from "@/lib/db";
import type { DashboardTask } from "@/lib/follow-up";
import { cn } from "@/lib/utils";

const iconByKind = {
  reminder: BellRing,
  expiring: CalendarClock,
  stale: RefreshCw,
  ready: Sparkles,
  delivery: Truck,
} as const;

const snoozeOptions = [
  { days: 1, label: "فردا" },
  { days: 3, label: "۳ روز دیگر" },
  { days: 7, label: "یک هفته دیگر" },
] as const;

export function TodayQueue({ tasks }: { tasks: DashboardTask[] }) {
  const { toast } = useToast();
  const [snoozeOpenId, setSnoozeOpenId] = React.useState<string | null>(null);
  if (!tasks.length) return null;
  const visible = tasks.slice(0, 5);

  async function markDone(reminderId: string) {
    await setReminderDone(reminderId, true);
    toast("پیگیری انجام‌شده ثبت شد.");
  }

  async function snooze(reminderId: string, days: number) {
    await snoozeReminder(reminderId, days);
    setSnoozeOpenId(null);
    toast(days === 1 ? "پیگیری تا فردا عقب افتاد." : `پیگیری ${days.toLocaleString("fa-IR-u-nu-arabext")} روز عقب افتاد.`);
  }

  return (
    <Card id="today-queue" className="mb-6 scroll-mt-24 overflow-hidden border-primary/20 bg-card/82 shadow-sm">
      <div className="flex flex-col gap-2 border-b border-border/85 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
              <BellRing className="size-4" />
            </span>
            <h2 className="type-section-title">کارهای امروز</h2>
            <Badge variant={tasks.some((item) => item.priority === "urgent") ? "warning" : "secondary"}>
              {tasks.length.toLocaleString("fa-IR-u-nu-arabext")}
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
                <div className="flex shrink-0 items-center gap-0.5">
                  <Popover
                    open={snoozeOpenId === task.reminderId}
                    onOpenChange={(open) => setSnoozeOpenId(open ? task.reminderId! : null)}
                  >
                    <PopoverTrigger
                      render={
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          aria-label="عقب انداختن پیگیری"
                          title="بعداً یادآوری کن"
                        >
                          <Clock3 />
                        </Button>
                      }
                    />
                    <PopoverContent align="end" className="w-44 p-1.5">
                      <div className="px-2 py-1.5 type-caption text-muted-foreground">بعداً یادآوری کن</div>
                      {snoozeOptions.map((option) => (
                        <Button
                          key={option.days}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => void snooze(task.reminderId!, option.days)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </PopoverContent>
                  </Popover>

                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => void markDone(task.reminderId!)}
                  >
                    <Check />
                    <span className="hidden sm:inline">انجام شد</span>
                  </Button>
                </div>
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
            {`و ${(tasks.length - visible.length).toLocaleString("fa-IR-u-nu-arabext")} مورد دیگر`}
          </span>
        </div>
      ) : null}
    </Card>
  );
}
