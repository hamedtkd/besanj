"use client";

import { Clock3, ExternalLink, ListChecks, ShieldCheck, Star, Truck, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { TomanIcon } from "@/components/ui/toman-icon";
import {
  channelLabel,
  cleanDisplayText,
  formatPersianDate,
  formatPhone,
  formatToman,
  formatUserText,
} from "@/lib/format";
import { freshnessLabel, getQuoteFreshness, quoteTotal } from "@/lib/quote";
import { getBudgetState, requirementMatchSummary } from "@/lib/planning";
import type { CaseRequirement, Provider, Quote } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SideBySideComparison({
  open,
  onOpenChange,
  quotes,
  providers,
  onRemove,
  onOpenDecision,
  targetBudgetToman,
  requirements = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotes: Quote[];
  providers: Provider[];
  onRemove: (quoteId: string) => void;
  onOpenDecision: () => void;
  targetBudgetToman?: number;
  requirements?: CaseRequirement[];
}) {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const totals = quotes.map(quoteTotal);
  const minTotal = totals.length ? Math.min(...totals) : null;
  const deliveryValues = quotes
    .map((quote) => quote.deliveryDays)
    .filter((value): value is number => value !== undefined);
  const minDelivery = deliveryValues.length ? Math.min(...deliveryValues) : null;

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="مقایسه کنار هم"
      description="تا ۴ گزینه را با همان معیارها کنار هم ببین؛ بعد مستقیم وارد تصمیم‌یار شو."
      className="sm:max-w-5xl"
    >
      <div className="p-4 sm:p-5">
        {quotes.length < 2 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <p className="type-body">برای مقایسه کنار هم، حداقل دو گزینه را انتخاب کن.</p>
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-3",
              quotes.length === 2 && "md:grid-cols-2",
              quotes.length === 3 && "md:grid-cols-3",
              quotes.length >= 4 && "md:grid-cols-2 xl:grid-cols-4"
            )}
          >
            {quotes.map((quote) => {
              const provider = providerById.get(quote.providerId);
              if (!provider) return null;
              const total = quoteTotal(quote);
              const freshness = getQuoteFreshness(quote);
              const contactRef = cleanDisplayText(quote.contactRef);
              const budgetState = getBudgetState({ targetBudgetToman }, quote);
              const requirementSummary = requirementMatchSummary(quote, requirements);
              return (
                <Card key={quote.id} className="relative overflow-hidden p-4">
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    aria-label={`حذف ${provider.name} از مقایسه`}
                    className="absolute start-2 top-2"
                    onClick={() => onRemove(quote.id)}
                  >
                    <X />
                  </Button>

                  <div className="pe-8">
                    <h3 className="type-card-title">{provider.name}</h3>
                    <p className="type-caption mt-1 text-muted-foreground">
                      {channelLabel(quote.channel)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="type-caption text-muted-foreground">قیمت نهایی</div>
                    <div className="type-data mt-1 inline-flex items-center gap-1 text-xl">
                      {formatToman(total)}
                      <TomanIcon className="size-4" />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {minTotal !== null && total === minTotal ? (
                        <Badge variant="success">کمترین قیمت</Badge>
                      ) : null}
                      <Badge
                        variant={
                          freshness === "expired"
                            ? "destructive"
                            : freshness === "stale"
                              ? "warning"
                              : freshness === "today"
                                ? "success"
                                : "secondary"
                        }
                      >
                        {freshnessLabel(freshness)}
                      </Badge>
                      {budgetState === "within" ? <Badge variant="success">داخل بودجه</Badge> : null}
                      {budgetState === "near" ? <Badge variant="warning">نزدیک بودجه</Badge> : null}
                      {budgetState === "over" ? <Badge variant="destructive">بالاتر از بودجه</Badge> : null}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <CompareRow label="قیمت پایه" value={`${formatToman(quote.priceToman)} تومان`} />
                    <CompareRow
                      label="هزینه اضافه"
                      value={quote.extraCostToman ? `${formatToman(quote.extraCostToman)} تومان` : "ندارد / ثبت نشده"}
                    />
                    <CompareRow label="تاریخ استعلام" value={formatPersianDate(quote.quotedAt)} icon={<Clock3 />} />
                    <CompareRow
                      label="تحویل"
                      value={
                        quote.deliveryDays === undefined
                          ? "ثبت نشده"
                          : quote.deliveryDays === 0
                            ? "فوری"
                            : `${quote.deliveryDays.toLocaleString("fa-IR")} روز`
                      }
                      icon={<Truck />}
                      highlight={minDelivery !== null && quote.deliveryDays === minDelivery}
                    />
                    <CompareRow label="گارانتی" value={formatUserText(quote.warranty)} icon={<ShieldCheck />} />
                    <CompareRow label="پرداخت" value={formatUserText(quote.paymentTerms)} />
                    <CompareRow
                      label="شرط‌های خرید"
                      value={
                        requirementSummary.total
                          ? requirementSummary.evaluated
                            ? `${requirementSummary.matched.toLocaleString("fa-IR")} از ${requirementSummary.total.toLocaleString("fa-IR")} مورد`
                            : "هنوز بررسی نشده"
                          : "شرطی ثبت نشده"
                      }
                      icon={<ListChecks />}
                      highlight={requirementSummary.total > 0 && requirementSummary.evaluated && requirementSummary.matched === requirementSummary.total}
                    />
                    <CompareRow
                      label="اعتماد فروشنده"
                      value={provider.rating ? `${provider.rating.toLocaleString("fa-IR")} از ۵` : "ثبت نشده"}
                      icon={<Star />}
                      highlight={Boolean(provider.rating && provider.rating >= 4)}
                    />
                    <CompareRow label="مرجع تماس" value={
                        contactRef
                          ? contactRef
                          : provider.phone
                            ? formatPhone(provider.phone)
                            : "ثبت نشده"
                      } icon={<ExternalLink />} />
                  </div>

                  {quote.note ? (
                    <p className="type-caption mt-3 rounded-xl bg-muted/50 px-3 py-2 text-muted-foreground">
                      {formatUserText(quote.note)}
                    </p>
                  ) : null}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-popover/95 p-4 backdrop-blur">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          بستن
        </Button>
        <Button type="button" disabled={quotes.length < 2} onClick={onOpenDecision}>
          ادامه به تصمیم‌یار
        </Button>
      </div>
    </ResponsiveSheet>
  );
}

function CompareRow({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={cn("rounded-xl bg-muted/45 px-3 py-2.5", highlight && "bg-profit/10")}> 
      <div className="flex items-center gap-1 text-muted-foreground [&_svg]:size-3.5">
        {icon}
        <span className="type-caption">{label}</span>
      </div>
      <div className={cn("type-body mt-0.5", highlight && "text-profit")}>{value}</div>
    </div>
  );
}
