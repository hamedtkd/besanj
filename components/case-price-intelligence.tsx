"use client";

import type * as React from "react";
import {
  CircleDollarSign,
  History,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { formatToman } from "@/lib/format";
import {
  buildCasePriceIntelligence,
  casePriceSignalLabel,
  priceConfidenceLabel,
  priceTrendLabel,
  type CasePriceSignal,
} from "@/lib/price-intelligence";
import { formatPersianPercent } from "@/lib/persian-number";
import type { PurchaseCase, Quote } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CasePriceIntelligence({
  purchaseCase,
  quotes,
}: {
  purchaseCase: PurchaseCase;
  quotes: Quote[];
}) {
  if (!quotes.length) return null;

  const intelligence = buildCasePriceIntelligence(purchaseCase.id, quotes);
  const signalVariant = badgeVariant(intelligence.signal);
  const description = signalDescription(intelligence.signal);
  const trendIcon =
    intelligence.trend === "down" ? (
      <TrendingDown className="size-4" />
    ) : intelligence.trend === "up" ? (
      <TrendingUp className="size-4" />
    ) : (
      <History className="size-4" />
    );

  return (
    <Card className="mb-4 overflow-hidden border-primary/15 bg-[linear-gradient(145deg,color-mix(in_oklab,var(--primary)_5%,var(--card)),var(--card))]">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <h2 className="type-section-title">هوش قیمت شخصی</h2>
              <HelpHint label="راهنمای هوش قیمت شخصی">
                این ارزیابی فقط از قیمت‌هایی ساخته می‌شود که خودت در همین پرونده ثبت کرده‌ای. بسنج قیمت امروز را با کف، میانه و روند سابقه خودت مقایسه می‌کند و هیچ قیمت بیرونی را حدس نمی‌زند.
              </HelpHint>
            </div>
            <p className="type-caption mt-2 max-w-2xl text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={signalVariant}>{casePriceSignalLabel(intelligence.signal)}</Badge>
            <Badge variant="outline">{priceConfidenceLabel(intelligence.confidence)}</Badge>
          </div>
        </div>

        {intelligence.signal === "insufficient" ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/45 px-3.5 py-3">
            <p className="type-caption text-muted-foreground">
              برای ارزیابی قابل اتکا، قیمت را در حداقل سه روز جدا ثبت کن. الان {intelligence.snapshotCount.toLocaleString("fa-IR-u-nu-arabext")} روز و {intelligence.providerCount.toLocaleString("fa-IR-u-nu-arabext")} فروشنده در این پرونده دیده می‌شود.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-2 sm:grid-cols-3">
              <PriceMetric
                label="بهترین قیمت فعلی"
                value={intelligence.currentBestToman}
                icon={<CircleDollarSign className="size-4" />}
              />
              <PriceMetric
                label="میانه سابقه"
                value={intelligence.historicalMedianToman}
                icon={<History className="size-4" />}
              />
              <PercentMetric
                label="فاصله از میانه"
                value={intelligence.currentVsMedianPercent}
                positiveIsGood
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/70 pt-3">
              <Badge
                variant={
                  intelligence.trend === "down"
                    ? "success"
                    : intelligence.trend === "up"
                      ? "warning"
                      : "outline"
                }
              >
                {trendIcon}
                {priceTrendLabel(intelligence.trend)}
                {intelligence.trendPercent !== null
                  ? ` ${formatSignedPercent(intelligence.trendPercent)}`
                  : ""}
              </Badge>
              <Badge variant="outline">
                {intelligence.snapshotCount.toLocaleString("fa-IR-u-nu-arabext")} روز سابقه
              </Badge>
              <Badge variant="outline">
                {intelligence.providerCount.toLocaleString("fa-IR-u-nu-arabext")} فروشنده
              </Badge>
              {intelligence.isAtHistoricalLow ? (
                <Badge variant="success">کف ثبت‌شده خودت</Badge>
              ) : null}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}

function PriceMetric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-background/55 p-3.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="type-caption">{label}</span>
      </div>
      <div className="type-data mt-2 inline-flex items-center gap-1.5 text-lg">
        <span>{value === null ? "داده ندارد" : formatToman(value)}</span>
        {value !== null ? <TomanIcon className="size-3.5 text-primary" /> : null}
      </div>
    </div>
  );
}

function PercentMetric({
  label,
  value,
  positiveIsGood,
}: {
  label: string;
  value: number | null;
  positiveIsGood?: boolean;
}) {
  const favorable = value !== null && (positiveIsGood ? value <= 0 : value >= 0);
  const unfavorable = value !== null && !favorable;

  return (
    <div className="rounded-2xl border border-border/80 bg-background/55 p-3.5">
      <div className="type-caption text-muted-foreground">{label}</div>
      <div
        className={cn(
          "type-data mt-2 text-lg",
          favorable && "text-profit",
          unfavorable && "text-amber-700 dark:text-amber-300"
        )}
      >
        {value === null ? "داده ندارد" : formatSignedPercent(value)}
      </div>
    </div>
  );
}

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) return "داده ندارد";
  if (Math.abs(value) < 0.05) return formatPersianPercent(0);
  const formatted = formatPersianPercent(Math.abs(value));
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}

function badgeVariant(signal: CasePriceSignal): "success" | "warning" | "outline" | "secondary" {
  if (signal === "excellent" || signal === "good") return "success";
  if (signal === "high" || signal === "stale") return "warning";
  if (signal === "fair") return "secondary";
  return "outline";
}

function signalDescription(signal: CasePriceSignal) {
  const descriptions: Record<CasePriceSignal, string> = {
    insufficient: "هنوز سابقه زمانی کافی برای قضاوت درباره قیمت این پرونده ساخته نشده است.",
    stale: "بهترین قیمت ثبت‌شده فعلی قدیمی شده است. قبل از تصمیم، یک استعلام تازه ارزش دارد.",
    excellent: "بهترین قیمت فعلی در کف سابقه خودت یا به‌طور محسوسی پایین‌تر از میانه ثبت‌های قبلی است.",
    good: "بهترین قیمت فعلی پایین‌تر از محدوده معمول سابقه همین پرونده است.",
    fair: "بهترین قیمت فعلی نزدیک محدوده معمول سابقه همین پرونده است.",
    high: "بهترین قیمت فعلی از میانه سابقه خودت بالاتر است و استعلام دوباره می‌تواند مفید باشد.",
  };
  return descriptions[signal];
}
