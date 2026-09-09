"use client";

import type * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  CircleDollarSign,
  Sparkles,
  Store,
  Target,
} from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { formatToman } from "@/lib/format";
import {
  buildPersonalPriceIntelligence,
  casePriceSignalLabel,
  priceConfidenceLabel,
  sellerPricePositionLabel,
} from "@/lib/price-intelligence";
import { formatPersianPercent } from "@/lib/persian-number";
import type { Provider, PurchaseCase, Quote, SellerProfile } from "@/lib/types";

export function PersonalPriceIntelligence({
  cases,
  quotes,
  providers,
  sellerProfiles,
  categoryKey,
  tag,
}: {
  cases: PurchaseCase[];
  quotes: Quote[];
  providers: Provider[];
  sellerProfiles: SellerProfile[];
  categoryKey?: string;
  tag?: string;
}) {
  const intelligence = buildPersonalPriceIntelligence(
    cases,
    quotes,
    providers,
    sellerProfiles,
    { categoryKey, tag }
  );

  return (
    <Card className="overflow-hidden border-primary/15">
      <div className="border-b border-border/80 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <h2 className="type-section-title">هوش قیمت شخصی</h2>
              <HelpHint label="راهنمای هوش قیمت شخصی">
                این بخش از قیمت‌هایی که خودت در پرونده‌ها ثبت کرده‌ای یاد می‌گیرد. قیمت فعلی هر پرونده با سابقه همان پرونده سنجیده می‌شود و جایگاه فروشنده‌ها هم فقط در پرونده‌هایی که رقیب داشته‌اند محاسبه می‌شود. هیچ قیمت بیرونی یا حدس عمومی بازار وارد این محاسبه نمی‌شود.
              </HelpHint>
            </div>
            <p className="type-caption mt-2 max-w-2xl text-muted-foreground">
              هرچه تعداد روزهای استعلام و پرونده‌های قابل مقایسه بیشتر شود، این بخش قابل اتکاتر می‌شود.
            </p>
          </div>
          <Badge variant="outline">فقط داده‌های خودت</Badge>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryMetric
            icon={<Target className="size-4" />}
            label="پرونده قابل ارزیابی"
            value={intelligence.eligibleCaseCount.toLocaleString("fa-IR-u-nu-arabext")}
          />
          <SummaryMetric
            icon={<BadgeCheck className="size-4" />}
            label="قیمت مناسب یا بهتر"
            value={intelligence.favorableCaseCount.toLocaleString("fa-IR-u-nu-arabext")}
          />
          <SummaryMetric
            icon={<CircleDollarSign className="size-4" />}
            label="بالاتر از سابقه"
            value={intelligence.highCaseCount.toLocaleString("fa-IR-u-nu-arabext")}
          />
          <SummaryMetric
            icon={<Sparkles className="size-4" />}
            label="میانگین فاصله از میانه"
            value={
              intelligence.averageCurrentVsMedianPercent === null
                ? "داده کم"
                : formatSignedPercent(intelligence.averageCurrentVsMedianPercent)
            }
          />
        </div>

        {intelligence.bestOpportunity ? (
          <div className="rounded-2xl border border-profit/25 bg-profit/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="success">فرصت شخصی فعلی</Badge>
                  <Badge variant="outline">
                    {priceConfidenceLabel(intelligence.bestOpportunity.confidence)}
                  </Badge>
                </div>
                <h3 className="type-card-title mt-2 truncate">
                  {intelligence.bestOpportunity.title}
                </h3>
                <p className="type-caption mt-1 text-muted-foreground">
                  {casePriceSignalLabel(intelligence.bestOpportunity.signal)} · بهترین قیمت فعلی {formatToman(intelligence.bestOpportunity.currentBestToman)}
                  {intelligence.bestOpportunity.currentBestToman !== null ? (
                    <TomanIcon className="mx-1 inline size-3" />
                  ) : null}
                  {intelligence.bestOpportunity.currentVsMedianPercent !== null
                    ? ` · ${formatSignedPercent(intelligence.bestOpportunity.currentVsMedianPercent)} نسبت به میانه سابقه`
                    : ""}
                </p>
              </div>
              <Button
                nativeButton={false}
                render={<Link href={`/cases/${intelligence.bestOpportunity.caseId}`} />}
                size="sm"
                variant="outline"
                className="shrink-0"
              >
                دیدن پرونده
                <ArrowLeft />
              </Button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-3">
            <p className="type-caption text-muted-foreground">
              هنوز پرونده فعالی با سابقه کافی و قیمت پایین‌تر از محدوده معمول پیدا نشده است. ثبت قیمت در چند روز مختلف این بخش را فعال‌تر می‌کند.
            </p>
          </div>
        )}

        {intelligence.sellers.length ? (
          <div>
            <div className="mb-2 flex items-center gap-1.5">
              <Store className="size-4 text-primary" />
              <h3 className="type-label">حافظه قیمتی فروشنده‌ها</h3>
              <HelpHint label="راهنمای حافظه قیمتی فروشنده‌ها">
                فاصله معمول هر فروشنده از ارزان‌ترین قیمت همان پرونده محاسبه می‌شود. این روش اجازه نمی‌دهد قیمت کالاهای گران و ارزان مستقیماً با هم جمع شوند.
              </HelpHint>
            </div>
            <div className="grid gap-2 lg:grid-cols-3">
              {intelligence.sellers.slice(0, 3).map((seller) => (
                <Link
                  key={seller.sellerProfileId}
                  href={`/sellers/${seller.sellerProfileId}`}
                  className="rounded-2xl border border-border/80 bg-muted/20 p-3.5 transition hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="type-label truncate">{seller.name}</div>
                      <p className="type-caption mt-1 text-muted-foreground">
                        {seller.comparisonCaseCount.toLocaleString("fa-IR-u-nu-arabext")} پرونده قابل مقایسه
                      </p>
                    </div>
                    <Badge variant={seller.position === "competitive" ? "success" : seller.position === "high" ? "warning" : "secondary"}>
                      {sellerPricePositionLabel(seller.position)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border/70 pt-2.5">
                    <span className="type-caption text-muted-foreground">فاصله معمول از ارزان‌ترین</span>
                    <strong className="type-data text-sm">
                      {seller.medianPremiumPercent === null
                        ? "داده کم"
                        : formatPersianPercent(seller.medianPremiumPercent)}
                    </strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function SummaryMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-muted/20 p-3.5">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="type-caption">{label}</span>
      </div>
      <div className="type-data mt-2 text-lg">{value}</div>
    </div>
  );
}

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) return "داده کم";
  if (Math.abs(value) < 0.05) return formatPersianPercent(0);
  const formatted = formatPersianPercent(Math.abs(value));
  return value > 0 ? `+${formatted}` : `-${formatted}`;
}
