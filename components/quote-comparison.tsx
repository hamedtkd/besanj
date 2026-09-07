"use client";

import { motion } from "motion/react";
import {
  Check,
  Clock3,
  GitCompareArrows,
  History,
  RefreshCw,
  ShieldCheck,
  Store,
  Truck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { TomanIcon } from "@/components/ui/toman-icon";
import {
  channelLabel,
  cleanDisplayText,
  formatCompactPersianDate,
  formatInteger,
  formatPhone,
  formatToman,
  formatUserText,
} from "@/lib/format";
import { freshnessLabel, getQuoteFreshness, quoteTotal } from "@/lib/quote";
import type { Provider, Quote } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuoteComparison({
  quotes,
  providers,
  selectedQuoteId,
  comparedQuoteIds,
  onSelect,
  onToggleCompare,
  onRequote,
  onOpenHistory,
}: {
  quotes: Quote[];
  providers: Provider[];
  selectedQuoteId?: string;
  comparedQuoteIds: string[];
  onSelect: (quote: Quote) => void;
  onToggleCompare: (quote: Quote) => void;
  onRequote: (quote: Quote, provider: Provider) => void;
  onOpenHistory: (providerId: string) => void;
}) {
  const providerById = new Map(
    providers.map((provider) => [provider.id, provider])
  );
  const min = quotes.length ? Math.min(...quotes.map(quoteTotal)) : null;
  const newestTime = quotes.length
    ? Math.max(...quotes.map((quote) => new Date(quote.quotedAt).getTime()))
    : null;

  return (
    <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
      {quotes.map((quote, index) => {
        const provider = providerById.get(quote.providerId);
        if (!provider) return null;

        const total = quoteTotal(quote);
        const compared = comparedQuoteIds.includes(quote.id);
        const selected = selectedQuoteId === quote.id;
        const cheapest = min !== null && total === min;
        const newest =
          newestTime !== null &&
          new Date(quote.quotedAt).getTime() === newestTime;
        const freshness = getQuoteFreshness(quote);
        const contactRef = cleanDisplayText(quote.contactRef);

        return (
          <motion.div
            key={quote.id}
            className="h-full"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.18,
              delay: Math.min(index * 0.025, 0.12),
            }}
          >
            <Card
              className={cn(
                "relative flex h-full min-h-[24rem] flex-col overflow-hidden transition-[border-color,box-shadow,background-color,transform] hover:-translate-y-0.5 hover:shadow-[0_18px_55px_color-mix(in_oklab,var(--foreground)_9%,transparent)]",
                compared && "border-primary/55 ring-1 ring-primary/15",
                selected &&
                  "border-primary/65 bg-primary/[0.045] ring-2 ring-primary/15"
              )}
            >
              <div
                className={cn(
                  "h-1 w-full shrink-0 bg-border",
                  (compared || selected || cheapest) && "bg-primary"
                )}
              />

              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-2xl border border-border bg-muted/60 text-muted-foreground",
                        (cheapest || selected) &&
                          "border-primary/25 bg-primary/10 text-primary"
                      )}
                    >
                      <Store className="size-4.5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                        <h3 className="type-card-title truncate">
                          {provider.name}
                        </h3>
                        {selected ? (
                          <Badge variant="success">انتخاب نهایی</Badge>
                        ) : null}
                      </div>
                      <p className="type-caption mt-1 truncate text-muted-foreground">
                        {channelLabel(quote.channel)}
                        {provider.phone
                          ? ` · ${formatPhone(provider.phone)}`
                          : ""}
                      </p>
                      {contactRef ? (
                        <p
                          dir="auto"
                          className="type-caption mt-0.5 truncate text-muted-foreground"
                        >
                          {contactRef}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  <label
                    className={cn(
                      "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5 text-xs transition-colors hover:bg-muted/70",
                      compared &&
                        "border-primary/35 bg-primary/[0.08] text-primary"
                    )}
                  >
                    <Checkbox
                      checked={compared}
                      onCheckedChange={() => onToggleCompare(quote)}
                      aria-label={`افزودن ${provider.name} به مقایسه`}
                    />
                    <GitCompareArrows className="size-3.5" />
                    <span>{compared ? "در مقایسه" : "مقایسه"}</span>
                  </label>
                </div>

                <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-3.5">
                  <div className="type-caption text-muted-foreground">
                    قیمت نهایی
                  </div>
                  <div className="type-data mt-1 inline-flex items-center gap-1.5 text-2xl">
                    {formatToman(total)}
                    <TomanIcon className="size-4 text-primary" />
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {cheapest ? (
                      <Badge variant="success">کمترین قیمت</Badge>
                    ) : null}
                    {newest ? (
                      <Badge variant="secondary">جدیدترین</Badge>
                    ) : null}
                    <FreshnessBadge freshness={freshness} />
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <MiniInfo
                    icon={<Clock3 />}
                    label="استعلام"
                    value={formatCompactPersianDate(quote.quotedAt)}
                  />
                  <MiniInfo
                    icon={<Truck />}
                    label="تحویل"
                    value={
                      quote.deliveryDays === undefined
                        ? "ثبت نشده"
                        : quote.deliveryDays === 0
                          ? "فوری"
                          : `${formatInteger(quote.deliveryDays)} روز`
                    }
                  />
                  <MiniInfo
                    icon={<ShieldCheck />}
                    label="گارانتی"
                    value={formatUserText(quote.warranty)}
                  />
                </div>

                {quote.paymentTerms || quote.note ? (
                  <div className="mt-3 space-y-1.5 rounded-xl border border-border bg-background/55 px-3 py-2.5">
                    {quote.paymentTerms ? (
                      <p className="type-caption line-clamp-1 text-muted-foreground">
                        <span className="font-medium text-foreground">
                          پرداخت:
                        </span>{" "}
                        {formatUserText(quote.paymentTerms)}
                      </p>
                    ) : null}
                    {quote.note ? (
                      <p className="type-caption line-clamp-2 text-muted-foreground">
                        {formatUserText(quote.note)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <div className="mt-auto pt-4">
                  <Button
                    type="button"
                    variant={selected ? "secondary" : "default"}
                    className={cn(
                      "w-full",
                      selected &&
                        "border border-primary/25 bg-primary/10 text-primary hover:bg-primary/15"
                    )}
                    onClick={() => onSelect(quote)}
                  >
                    <Check />
                    {selected
                      ? "لغو انتخاب نهایی"
                      : "انتخاب به‌عنوان گزینه نهایی"}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-border bg-muted/20 p-3">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onOpenHistory(provider.id)}
                >
                  <History />
                  تاریخچه
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => onRequote(quote, provider)}
                >
                  <RefreshCw />
                  استعلام مجدد
                </Button>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

function MiniInfo({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-background/55 px-2.5 py-2.5">
      <div className="flex items-center gap-1 text-muted-foreground [&_svg]:size-3.5">
        {icon}
        <span className="type-caption truncate">{label}</span>
      </div>
      <div className="type-label mt-1 truncate" title={value}>
        {value}
      </div>
    </div>
  );
}

function FreshnessBadge({
  freshness,
}: {
  freshness: ReturnType<typeof getQuoteFreshness>;
}) {
  return (
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
  );
}
