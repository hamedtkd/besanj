"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, PiggyBank, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { formatToman } from "@/lib/format";
import type { MonthlyBudgetSnapshot } from "@/lib/budget";
import { cn } from "@/lib/utils";

export function MonthlyBudgetSummary({ snapshot }: { snapshot: MonthlyBudgetSnapshot }) {
  if (!snapshot.overall.limitToman && !snapshot.categories.some((item) => item.limitToman)) {
    return null;
  }

  const overall = snapshot.overall;
  const ratio = overall.ratio === null ? 0 : Math.min(1, overall.ratio);
  const warning = overall.health === "near" || overall.health === "over";

  return (
    <Card className="mb-5 overflow-hidden border-border/90 bg-card/75 sm:mb-6">
      <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn(
              "grid size-9 place-items-center rounded-xl",
              warning ? "bg-amber-500/12 text-amber-700 dark:text-amber-300" : "bg-primary/10 text-primary"
            )}>
              {warning ? <AlertTriangle className="size-4" /> : <PiggyBank className="size-4" />}
            </span>
            <div>
              <h2 className="type-card-title">بودجه {snapshot.monthLabel}</h2>
              <p className="type-caption mt-0.5 text-muted-foreground">
                {snapshot.purchaseCount.toLocaleString("fa-IR")} خرید در این ماه ثبت شده است.
              </p>
            </div>
          </div>

          {overall.limitToman ? (
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  مصرف شده
                  <strong className="type-data text-foreground">{formatToman(overall.spentToman)}</strong>
                  <TomanIcon className="size-3.5" />
                </span>
                <span className={cn("type-caption", warning ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>
                  {overall.remainingToman !== null && overall.remainingToman >= 0
                    ? `${formatToman(overall.remainingToman)} باقی مانده`
                    : `${formatToman(Math.abs(overall.remainingToman ?? 0))} بیشتر از سقف`}
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-label="درصد مصرف بودجه ماهانه">
                <div
                  className={cn("h-full rounded-full", overall.health === "over" ? "bg-destructive" : overall.health === "near" ? "bg-amber-500" : "bg-primary")}
                  style={{ width: `${Math.max(2, ratio * 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-muted/55 px-3 py-2 text-sm text-muted-foreground">
              <WalletCards className="size-4" />
              فقط سقف دسته‌ها تنظیم شده است.
            </div>
          )}
        </div>

        <Button nativeButton={false} render={<Link href="/insights#budget" />} variant="outline">
          جزئیات بودجه
          <ArrowLeft />
        </Button>
      </div>
    </Card>
  );
}
