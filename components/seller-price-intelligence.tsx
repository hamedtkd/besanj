"use client";

import type * as React from "react";
import { BadgeCheck, CircleDollarSign, Store } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  buildSellerPriceIntelligence,
  priceConfidenceLabel,
  sellerPricePositionLabel,
} from "@/lib/price-intelligence";
import { formatPersianPercent } from "@/lib/persian-number";
import type { Provider, Quote, SellerProfile } from "@/lib/types";

export function SellerPriceIntelligenceCard({
  profile,
  providers,
  quotes,
}: {
  profile: SellerProfile;
  providers: Provider[];
  quotes: Quote[];
}) {
  const intelligence = buildSellerPriceIntelligence(profile, providers, quotes);

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <CircleDollarSign className="size-4" />
              </span>
              <h2 className="type-section-title">جایگاه قیمتی فروشنده</h2>
              <HelpHint label="راهنمای جایگاه قیمتی فروشنده">
                بسنج فقط پرونده‌هایی را مقایسه می‌کند که در آن‌ها از دست‌کم دو فروشنده قیمت داری. برای هر پرونده، قیمت این فروشنده با کمترین قیمت همان پرونده سنجیده می‌شود تا گرانی یا ارزانی کالاهای متفاوت با هم قاطی نشود.
              </HelpHint>
            </div>
            <p className="type-caption mt-2 text-muted-foreground">
              این شاخص از سابقه قیمت‌های خودت ساخته می‌شود و قیمت عمومی بازار نیست.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant={positionVariant(intelligence.position)}>
              {sellerPricePositionLabel(intelligence.position)}
            </Badge>
            <Badge variant="outline">{priceConfidenceLabel(intelligence.confidence)}</Badge>
          </div>
        </div>

        {intelligence.comparisonCaseCount < 2 ? (
          <div className="rounded-2xl border border-dashed border-border bg-muted/25 px-3.5 py-3">
            <p className="type-caption text-muted-foreground">
              برای قضاوت بهتر، از این فروشنده در حداقل دو پرونده‌ای که فروشنده رقیب هم دارند قیمت ثبت کن. فعلاً {intelligence.comparisonCaseCount.toLocaleString("fa-IR-u-nu-arabext")} پرونده قابل مقایسه داریم.
            </p>
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-3">
            <SellerMetric
              icon={<Store className="size-4" />}
              label="پرونده قابل مقایسه"
              value={intelligence.comparisonCaseCount.toLocaleString("fa-IR-u-nu-arabext")}
            />
            <SellerMetric
              icon={<CircleDollarSign className="size-4" />}
              label="فاصله معمول از ارزان‌ترین"
              value={formatPersianPercent(intelligence.medianPremiumPercent ?? 0)}
            />
            <SellerMetric
              icon={<BadgeCheck className="size-4" />}
              label="دفعات ارزان‌ترین"
              value={
                intelligence.cheapestRate === null
                  ? "داده ندارد"
                  : formatPersianPercent(intelligence.cheapestRate * 100)
              }
            />
          </div>
        )}
      </div>
    </Card>
  );
}

function SellerMetric({
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

function positionVariant(
  position: ReturnType<typeof buildSellerPriceIntelligence>["position"]
): "success" | "warning" | "secondary" | "outline" {
  if (position === "competitive") return "success";
  if (position === "high") return "warning";
  if (position === "average") return "secondary";
  return "outline";
}
