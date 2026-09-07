"use client";

import { Archive, CheckCircle2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { useToast } from "@/components/toast";
import { selectQuote, setPurchaseStatus } from "@/lib/db";
import { formatPersianDate, formatToman, kindLabel } from "@/lib/format";
import { quoteTotal } from "@/lib/quote";
import type { Provider, PurchaseCase, Quote } from "@/lib/types";

export function CaseDetailsPanel({
  purchaseCase,
  quotes,
  providers,
}: {
  purchaseCase: PurchaseCase;
  quotes: Quote[];
  providers: Provider[];
}) {
  const { toast } = useToast();
  const selected = quotes.find((quote) => quote.id === purchaseCase.selectedQuoteId);
  const selectedProvider = selected
    ? providers.find((provider) => provider.id === selected.providerId)
    : undefined;

  async function toggleArchive() {
    if (purchaseCase.status === "archived") {
      await setPurchaseStatus(purchaseCase.id, purchaseCase.selectedQuoteId ? "decided" : "active");
      toast("پرونده به لیست برگردانده شد.");
    } else {
      await setPurchaseStatus(purchaseCase.id, "archived");
      toast("پرونده آرشیو شد.");
    }
  }

  async function clearSelection() {
    await selectQuote(purchaseCase.id, undefined);
    toast("انتخاب نهایی پاک شد.");
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
      <Card className="p-4 sm:p-5">
        <h3 className="type-section-title">اطلاعات پرونده</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Row label="نوع">{kindLabel(purchaseCase.kind)}</Row>
          <Row label="وضعیت">
            <Badge
              variant={
                purchaseCase.status === "decided"
                  ? "success"
                  : purchaseCase.status === "archived"
                    ? "outline"
                    : "secondary"
              }
            >
              {purchaseCase.status === "active"
                ? "فعال"
                : purchaseCase.status === "decided"
                  ? "تصمیم‌گرفته"
                  : "آرشیو"}
            </Badge>
          </Row>
          <Row label="ساخته‌شده">{formatPersianDate(purchaseCase.createdAt)}</Row>
          <Row label="آخرین تغییر">{formatPersianDate(purchaseCase.updatedAt)}</Row>
        </div>

        {purchaseCase.description ? (
          <div className="mt-4 rounded-2xl bg-muted/50 p-3.5">
            <div className="type-caption text-muted-foreground">توضیحات</div>
            <p className="type-body mt-1 whitespace-pre-wrap">{purchaseCase.description}</p>
          </div>
        ) : null}

        <div className="mt-4">
          <Button type="button" variant="outline" onClick={toggleArchive}>
            {purchaseCase.status === "archived" ? <RotateCcw /> : <Archive />}
            {purchaseCase.status === "archived" ? "بازگرداندن پرونده" : "آرشیو پرونده"}
          </Button>
        </div>
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="size-5 text-primary" />
          <h3 className="type-section-title">تصمیم نهایی</h3>
        </div>

        {selected && selectedProvider ? (
          <div className="mt-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
              <div className="type-caption text-muted-foreground">انتخاب فعلی</div>
              <div className="mt-1 font-medium">{selectedProvider.name}</div>
              <div className="type-data mt-2 inline-flex items-center gap-1 text-xl text-primary">
                {formatToman(quoteTotal(selected))}
                <TomanIcon className="size-4" />
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-2 w-full"
              onClick={clearSelection}
            >
              لغو انتخاب نهایی
            </Button>
          </div>
        ) : (
          <p className="type-body mt-4 text-muted-foreground">
            هنوز گزینه‌ای را نهایی نکرده‌ای. از تب مقایسه یکی از استعلام‌ها را انتخاب کن.
          </p>
        )}
      </Card>
    </div>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2.5">
      <div className="type-caption text-muted-foreground">{label}</div>
      <div className="type-body mt-1">{children}</div>
    </div>
  );
}
