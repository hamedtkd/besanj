"use client";

import { CheckCircle2, Pencil, PackageCheck, ReceiptText, TrendingDown, WalletCards } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { formatPersianDate, formatToman, formatUserText } from "@/lib/format";
import {
  buildPurchaseOutcomeInsight,
  purchaseOutcomeStatusLabel,
} from "@/lib/purchase-outcome";
import type { Provider, PurchaseCase, Quote } from "@/lib/types";

export function PurchaseOutcomeCard({
  purchaseCase,
  quote,
  provider,
  latestQuotes,
  onEdit,
}: {
  purchaseCase: PurchaseCase;
  quote: Quote;
  provider: Provider;
  latestQuotes: Quote[];
  onEdit: () => void;
}) {
  const outcome = purchaseCase.purchaseOutcome;
  const insight = buildPurchaseOutcomeInsight(purchaseCase, quote, latestQuotes);
  if (!outcome || !insight) return null;

  const delta = insight.differenceFromQuoteToman;
  const budgetDelta = insight.differenceFromBudgetToman;

  return (
    <Card className="mb-6 overflow-hidden border-emerald-500/25 bg-emerald-500/[0.055]">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/12 text-emerald-700 dark:text-emerald-300">
              {outcome.status === "received" ? (
                <PackageCheck className="size-5" />
              ) : (
                <CheckCircle2 className="size-5" />
              )}
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="type-section-title">نتیجه واقعی خرید</h2>
                <Badge variant="success">{purchaseOutcomeStatusLabel(outcome.status)}</Badge>
              </div>
              <p className="type-caption mt-1 text-muted-foreground">
                {provider.name} · خرید {formatPersianDate(outcome.purchasedAt)}
              </p>
            </div>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            <Pencil />ویرایش
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Metric
            label="پرداخت واقعی"
            value={formatToman(outcome.actualPaidToman)}
            icon={<ReceiptText className="size-3.5" />}
            emphasized
          />
          <Metric
            label="نسبت به استعلام"
            value={
              delta === 0
                ? "بدون تغییر"
                : `${delta > 0 ? "+" : "−"}${formatToman(Math.abs(delta))}`
            }
          />
          <Metric
            label="نسبت به بودجه"
            value={
              budgetDelta === null
                ? "بودجه ثبت نشده"
                : budgetDelta <= 0
                  ? `${formatToman(Math.abs(budgetDelta))} زیر سقف`
                  : `${formatToman(budgetDelta)} بالای سقف`
            }
            icon={<WalletCards className="size-3.5" />}
          />
          <Metric
            label="صرفه‌جویی نسبت به گران‌ترین گزینه"
            value={
              insight.savingsVsHighestToman === null
                ? "—"
                : formatToman(insight.savingsVsHighestToman)
            }
            icon={<TrendingDown className="size-3.5" />}
          />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-emerald-500/15 pt-3 text-sm text-muted-foreground">
          {outcome.orderReference ? (
            <span>مرجع سفارش: {formatUserText(outcome.orderReference)}</span>
          ) : null}
          {outcome.expectedDeliveryAt ? (
            <span>تحویل مورد انتظار: {formatPersianDate(outcome.expectedDeliveryAt)}</span>
          ) : null}
          {outcome.receivedAt ? (
            <span>دریافت: {formatPersianDate(outcome.receivedAt)}</span>
          ) : null}
          {outcome.note ? <span className="basis-full">یادداشت: {formatUserText(outcome.note)}</span> : null}
        </div>
      </div>
    </Card>
  );
}

function Metric({
  label,
  value,
  icon,
  emphasized = false,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  emphasized?: boolean;
}) {
  return (
    <div className={emphasized ? "rounded-2xl border border-emerald-500/20 bg-background/75 p-3" : "rounded-2xl border border-border/80 bg-background/55 p-3"}>
      <div className="type-caption flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={emphasized ? "type-data mt-1 inline-flex items-center gap-1 text-lg text-emerald-700 dark:text-emerald-300" : "type-data mt-1 text-sm"}>
        {value}
        {emphasized ? <TomanIcon className="size-3.5" /> : null}
      </div>
    </div>
  );
}
