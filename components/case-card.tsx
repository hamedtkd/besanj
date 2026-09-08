"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowLeft,
  BadgeCheck,
  Clock3,
  Package,
  RefreshCw,
  Stethoscope,
  Store,
  WalletCards,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { formatCompactPersianDate, formatToman, kindLabel } from "@/lib/format";
import { buildCaseMetrics, getQuoteFreshness } from "@/lib/quote";
import { getBudgetState } from "@/lib/planning";
import type { PurchaseCase, Quote } from "@/lib/types";

export function CaseCard({
  purchaseCase,
  quotes,
}: {
  purchaseCase: PurchaseCase;
  quotes: Quote[];
}) {
  const metrics = buildCaseMetrics(quotes);
  const needsFollowUp = metrics.latestQuotes.some((quote) => {
    const freshness = getQuoteFreshness(quote);
    return freshness === "stale" || freshness === "expired";
  });
  const budgetState = metrics.latestQuotes[0]
    ? getBudgetState(purchaseCase, metrics.latestQuotes[0])
    : "none";
  const status =
    purchaseCase.status === "decided"
      ? { label: "تصمیم‌گرفته", variant: "success" as const }
      : purchaseCase.status === "archived"
        ? { label: "آرشیو", variant: "outline" as const }
        : { label: "فعال", variant: "secondary" as const };

  return (
    <motion.div
      layout
      className="h-full"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
    >
      <Link
        href={`/cases/${purchaseCase.id}`}
        className="block h-full rounded-2xl focus:outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
      >
        <Card className="group relative flex h-full min-h-[16.5rem] flex-col overflow-hidden border-border/95 bg-card/82 transition duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-[0_20px_54px_color-mix(in_oklab,var(--foreground)_9%,transparent)]">
          <span
            className="absolute inset-x-0 top-0 h-0.5 bg-primary opacity-0 transition-opacity group-hover:opacity-100"
            aria-hidden
          />

          <div className="flex-1 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/15 bg-primary/10 text-primary shadow-sm">
                {purchaseCase.kind === "product" ? (
                  <Package className="size-5" />
                ) : (
                  <Stethoscope className="size-5" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="type-card-title min-w-0 flex-1 truncate">
                    {purchaseCase.title}
                  </h2>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
                <p className="type-caption mt-1 text-muted-foreground">
                  {kindLabel(purchaseCase.kind)}
                  {metrics.providerCount > 0
                    ? ` · ${metrics.providerCount.toLocaleString("fa-IR")} فروشنده`
                    : " · هنوز استعلامی ندارد"}
                </p>
              </div>
            </div>

            {metrics.providerCount ? (
              <>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {purchaseCase.selectedQuoteId ? (
                    <Badge variant="success">
                      <BadgeCheck />
                      گزینه نهایی انتخاب شده
                    </Badge>
                  ) : null}
                  {needsFollowUp ? (
                    <Badge variant="warning">
                      <RefreshCw />
                      بعضی قیمت‌ها قدیمی‌اند
                    </Badge>
                  ) : null}
                  {budgetState === "within" ? (
                    <Badge variant="success">
                      <WalletCards />
                      گزینه داخل بودجه داری
                    </Badge>
                  ) : budgetState === "over" ? (
                    <Badge variant="destructive">
                      <WalletCards />
                      همه گزینه‌ها بالای بودجه‌اند
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  <Metric
                    emphasized
                    label="کمترین قیمت"
                    value={
                      <span className="inline-flex items-center gap-1">
                        {formatToman(metrics.minTotal)}
                        <TomanIcon className="size-3.5" />
                      </span>
                    }
                  />
                  <Metric
                    label="بیشترین قیمت"
                    value={
                      <span className="inline-flex items-center gap-1">
                        {formatToman(metrics.maxTotal)}
                        <TomanIcon className="size-3.5" />
                      </span>
                    }
                  />
                  <Metric
                    className="col-span-2 sm:col-span-1"
                    label="آخرین استعلام"
                    value={
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="size-3.5" />
                        {formatCompactPersianDate(metrics.latestQuotedAt)}
                      </span>
                    }
                  />
                </div>
              </>
            ) : (
              <div className="mt-5 flex min-h-20 items-center gap-3 rounded-2xl border border-dashed border-border bg-muted/35 px-3.5 py-3 text-muted-foreground">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-background shadow-sm">
                  <Store className="size-4" />
                </span>
                <div>
                  <div className="type-label text-foreground">هنوز قیمتی ثبت نشده</div>
                  <span className="type-caption">
                    اولین استعلام را اضافه کن تا مقایسه شروع شود.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border/85 bg-muted/25 px-4 py-3 sm:px-5">
            <span className="type-caption text-muted-foreground">
              {metrics.quoteCount.toLocaleString("fa-IR")} استعلام ثبت‌شده
            </span>
            <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-primary transition-colors group-hover:bg-primary/10">
              باز کردن پرونده
              <ArrowLeft className="size-4" />
            </span>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function Metric({
  label,
  value,
  className,
  emphasized = false,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-3 py-2.5 ${
        emphasized
          ? "border-primary/18 bg-primary/[0.07]"
          : "border-transparent bg-muted/50"
      } ${className ?? ""}`}
    >
      <div className="type-caption text-muted-foreground">{label}</div>
      <div className={`type-data mt-1 text-sm ${emphasized ? "text-primary" : ""}`}>
        {value}
      </div>
    </div>
  );
}
