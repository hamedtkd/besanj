"use client";

import * as React from "react";
import { AlertTriangle, PiggyBank, Settings2, WalletCards } from "lucide-react";
import { BudgetSettingsSheet } from "@/components/budget-settings-sheet";
import { HelpHint } from "@/components/help-hint";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { formatToman } from "@/lib/format";
import type { MonthlyBudgetSnapshot } from "@/lib/budget";
import type { BudgetPlan, PurchaseCase } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BudgetOverview({
  cases,
  plan,
  snapshot,
}: {
  cases: PurchaseCase[];
  plan?: BudgetPlan | null;
  snapshot: MonthlyBudgetSnapshot;
}) {
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const configured = Boolean(
    snapshot.overall.limitToman || snapshot.categories.some((item) => item.limitToman)
  );

  return (
    <>
      <Card id="budget" className="overflow-hidden scroll-mt-24">
        <div className="flex flex-col gap-3 border-b border-border/80 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <PiggyBank className="size-5" />
            </span>
            <div className="flex items-center gap-1.5">
              <h2 className="type-section-title">بودجه {snapshot.monthLabel}</h2>
              <HelpHint label="راهنمای بودجه ماهانه">
                میزان مصرف از مبلغ واقعی خریدهای ثبت‌شده همین ماه محاسبه می‌شود.
              </HelpHint>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => setSettingsOpen(true)}>
            <Settings2 />
            {configured ? "ویرایش بودجه" : "تنظیم بودجه"}
          </Button>
        </div>

        {configured ? (
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <OverallBudget snapshot={snapshot} />
            <CategoryBudgets snapshot={snapshot} />
          </div>
        ) : (
          <div className="grid min-h-40 place-items-center p-6 text-center">
            <div className="max-w-md">
              <WalletCards className="mx-auto size-8 text-muted-foreground" />
              <h3 className="type-card-title mt-3">هنوز سقف ماهانه تعیین نشده است</h3>
              <p className="type-caption mt-1 text-muted-foreground">
                می‌توانی برای کل ماه یا برای هر دسته سقف جدا بگذاری و نزدیک‌شدن به آن را ببینی.
              </p>
            </div>
          </div>
        )}
      </Card>

      <BudgetSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        cases={cases}
        plan={plan}
      />
    </>
  );
}

function OverallBudget({ snapshot }: { snapshot: MonthlyBudgetSnapshot }) {
  const progress = snapshot.overall;
  const ratio = progress.ratio === null ? 0 : Math.min(1, progress.ratio);
  const warning = progress.health === "near" || progress.health === "over";

  return (
    <div className="border-b border-border/70 p-4 sm:p-5 lg:border-b-0 lg:border-e">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="type-caption text-muted-foreground">بودجه کل ماه</p>
          {progress.limitToman ? (
            <div className="type-data mt-1 inline-flex items-center gap-1 text-lg">
              {formatToman(progress.limitToman)}
              <TomanIcon className="size-4" />
            </div>
          ) : (
            <div className="type-body mt-1 text-muted-foreground">سقف کلی ثبت نشده</div>
          )}
        </div>
        {warning ? (
          <Badge variant={progress.health === "over" ? "destructive" : "warning"}>
            <AlertTriangle />
            {progress.health === "over" ? "بالاتر از سقف" : "نزدیک سقف"}
          </Badge>
        ) : progress.limitToman ? (
          <Badge variant="success">کنترل‌شده</Badge>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <BudgetNumber label="مصرف شده" value={progress.spentToman} />
        <BudgetNumber
          label={progress.remainingToman !== null && progress.remainingToman < 0 ? "بیشتر از سقف" : "باقی مانده"}
          value={Math.abs(progress.remainingToman ?? 0)}
          muted={progress.remainingToman === null}
        />
      </div>

      {progress.limitToman ? (
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>درصد مصرف</span>
            <span className="type-data">{Math.round((progress.ratio ?? 0) * 100).toLocaleString("fa-IR-u-nu-arabext")}٪</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full",
                progress.health === "over"
                  ? "bg-destructive"
                  : progress.health === "near"
                    ? "bg-amber-500"
                    : "bg-primary"
              )}
              style={{ width: `${Math.max(2, ratio * 100)}%` }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CategoryBudgets({ snapshot }: { snapshot: MonthlyBudgetSnapshot }) {
  const rows = snapshot.categories.filter((item) => item.limitToman);
  return (
    <div className="p-4 sm:p-5">
      <div className="mb-3">
        <p className="type-caption text-muted-foreground">بودجه دسته‌ها</p>
        <p className="type-label mt-0.5">{rows.length.toLocaleString("fa-IR-u-nu-arabext")} دسته با سقف جدا</p>
      </div>
      {rows.length ? (
        <div className="grid gap-2">
          {rows.map((row) => (
            <div key={row.categoryKey} className="rounded-2xl border border-border bg-muted/25 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="type-label truncate">{row.categoryLabel}</div>
                  <p className="type-caption mt-0.5 text-muted-foreground">
                    {row.purchaseCount.toLocaleString("fa-IR-u-nu-arabext")} خرید
                  </p>
                </div>
                <Badge variant={row.health === "over" ? "destructive" : row.health === "near" ? "warning" : "outline"}>
                  {row.health === "over" ? "عبور" : row.health === "near" ? "نزدیک سقف" : "عادی"}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 type-caption text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  مصرف {formatToman(row.spentToman)} <TomanIcon className="size-3" />
                </span>
                <span className="inline-flex items-center gap-1">
                  سقف {formatToman(row.limitToman)} <TomanIcon className="size-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="type-caption rounded-2xl bg-muted/35 p-3 text-muted-foreground">
          هنوز برای هیچ دسته‌ای سقف جدا تعیین نشده است.
        </p>
      )}
    </div>
  );
}

function BudgetNumber({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-muted/40 p-3">
      <p className="type-caption text-muted-foreground">{label}</p>
      <div className={cn("type-data mt-1 inline-flex items-center gap-1", muted && "text-muted-foreground")}>
        {muted ? "ثبت نشده" : formatToman(value)}
        {!muted ? <TomanIcon className="size-3.5" /> : null}
      </div>
    </div>
  );
}
