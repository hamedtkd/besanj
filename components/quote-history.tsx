"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Minus, RefreshCw, Store } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TomanIcon } from "@/components/ui/toman-icon";
import {
  channelLabel,
  cleanDisplayText,
  formatPersianDate,
  formatToman,
  formatUserText,
} from "@/lib/format";
import {
  findPreviousQuote,
  freshnessLabel,
  getQuoteFreshness,
  quoteChangePercent,
  quoteTotal,
} from "@/lib/quote";
import type { Provider, Quote } from "@/lib/types";
import { cn } from "@/lib/utils";

export function QuoteHistory({
  quotes,
  providers,
  selectedProviderId,
  onSelectedProviderChange,
}: {
  quotes: Quote[];
  providers: Provider[];
  selectedProviderId?: string;
  onSelectedProviderChange?: (providerId: string) => void;
}) {
  const [internalProviderId, setInternalProviderId] = React.useState("all");
  const providerFilter = selectedProviderId ?? internalProviderId;
  const setProviderFilter = onSelectedProviderChange ?? setInternalProviderId;
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const activeProviders = providers.filter((provider) => quotes.some((quote) => quote.providerId === provider.id));
  const filtered = providerFilter === "all" ? quotes : quotes.filter((quote) => quote.providerId === providerFilter);
  const sorted = [...filtered].sort((a, b) => {
    const byQuotedAt = new Date(b.quotedAt).getTime() - new Date(a.quotedAt).getTime();
    if (byQuotedAt !== 0) return byQuotedAt;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const selectedProvider = providerFilter === "all" ? null : providerById.get(providerFilter) ?? null;
  const selectedStats = selectedProvider ? buildProviderStats(sorted) : null;

  return (
    <div>
      <Card className="mb-4 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-2">
            <Store className="size-4 text-primary" />
            <h2 className="type-card-title">تاریخچه فروشنده</h2>
            <HelpHint label="راهنمای تاریخچه فروشنده">
              همه استعلام‌ها را ببین یا یک فروشنده را انتخاب کن تا روند قیمت همان فروشگاه جدا شود.
            </HelpHint>
          </div>
          <div className="w-full sm:w-72">
            <Select<string>
              value={providerFilter}
              onValueChange={(next) => { if (next !== null) setProviderFilter(next); }}
              items={[
                { value: "all", label: "همه فروشنده‌ها" },
                ...activeProviders.map((provider) => ({ value: provider.id, label: provider.name })),
              ]}
            >
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه فروشنده‌ها</SelectItem>
                {activeProviders.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProvider && selectedStats ? (
          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 sm:grid-cols-4">
            <HistoryMetric label="تعداد استعلام" value={selectedStats.count.toLocaleString("fa-IR-u-nu-arabext")} />
            <HistoryMetric label="کمترین قیمت" value={`${formatToman(selectedStats.min)} تومان`} />
            <HistoryMetric label="بیشترین قیمت" value={`${formatToman(selectedStats.max)} تومان`} />
            <HistoryMetric
              label="تغییر اولین تا آخرین"
              value={
                selectedStats.change === null
                  ? "—"
                  : selectedStats.change === 0
                    ? "بدون تغییر"
                    : `${Math.abs(selectedStats.change).toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 1 })}٪ ${selectedStats.change > 0 ? "افزایش" : "کاهش"}`
              }
              tone={selectedStats.change === null || selectedStats.change === 0 ? undefined : selectedStats.change > 0 ? "loss" : "profit"}
            />
          </div>
        ) : null}
      </Card>

      <div className="relative space-y-3">
        <div className="absolute bottom-3 end-[1.15rem] top-3 w-px bg-border sm:end-[1.4rem]" />
        {sorted.map((quote) => {
          const provider = providerById.get(quote.providerId);
          if (!provider) return null;
          const previous = findPreviousQuote(quote, quotes);
          const change = quoteChangePercent(quote, previous);
          const freshness = getQuoteFreshness(quote);
          const contactRef = cleanDisplayText(quote.contactRef);

          return (
            <div key={quote.id} className="relative pe-10 sm:pe-12">
              <span className="absolute end-[.72rem] top-5 z-10 grid size-3.5 place-items-center rounded-full border-2 border-background bg-primary sm:end-[.97rem]" />
              <Card className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="type-card-title">{provider.name}</h3>
                      {quote.previousQuoteId ? (
                        <Badge variant="outline"><RefreshCw />استعلام مجدد</Badge>
                      ) : null}
                    </div>
                    <p className="type-caption mt-1 text-muted-foreground">
                      {formatPersianDate(quote.quotedAt)} · {channelLabel(quote.channel)}
                    </p>
                    {contactRef ? (
                      <p dir="auto" className="type-caption mt-1 text-muted-foreground">{contactRef}</p>
                    ) : null}
                  </div>

                  <div className="text-end">
                    <div className="type-data inline-flex items-center gap-1 text-lg">
                      {formatToman(quoteTotal(quote))}
                      <TomanIcon className="size-4" />
                    </div>
                    <div className="mt-1 flex justify-end">
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
                    </div>
                  </div>
                </div>

                {previous && change !== null ? (
                  <div
                    className={cn(
                      "mt-3 inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-medium",
                      change > 0
                        ? "bg-loss/10 text-loss"
                        : change < 0
                          ? "bg-profit/10 text-profit"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {change > 0 ? <ArrowUp className="size-3.5" /> : change < 0 ? <ArrowDown className="size-3.5" /> : <Minus className="size-3.5" />}
                    {change === 0
                      ? "بدون تغییر نسبت به قیمت قبلی"
                      : `${Math.abs(change).toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 1 })}٪ ${change > 0 ? "گران‌تر" : "ارزان‌تر"} از قبل`}
                  </div>
                ) : null}

                <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  {quote.deliveryDays !== undefined ? (
                    <Detail label="تحویل">
                      {quote.deliveryDays === 0 ? "فوری" : `${quote.deliveryDays.toLocaleString("fa-IR-u-nu-arabext")} روز`}
                    </Detail>
                  ) : null}
                  {quote.warranty ? <Detail label="گارانتی">{formatUserText(quote.warranty)}</Detail> : null}
                  {quote.paymentTerms ? <Detail label="پرداخت">{formatUserText(quote.paymentTerms)}</Detail> : null}
                  {quote.note ? <Detail label="یادداشت">{formatUserText(quote.note)}</Detail> : null}
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildProviderStats(quotes: Quote[]) {
  if (!quotes.length) return null;
  const chronological = [...quotes].sort((a, b) => new Date(a.quotedAt).getTime() - new Date(b.quotedAt).getTime());
  const totals = chronological.map(quoteTotal);
  const first = totals[0];
  const last = totals[totals.length - 1];
  return {
    count: quotes.length,
    min: Math.min(...totals),
    max: Math.max(...totals),
    change: first > 0 ? ((last - first) / first) * 100 : null,
  };
}

function HistoryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "profit" | "loss";
}) {
  return (
    <div className="rounded-xl bg-muted/45 p-3">
      <div className="type-caption text-muted-foreground">{label}</div>
      <div className={cn("type-data mt-1 text-sm", tone === "profit" && "text-profit", tone === "loss" && "text-loss")}>{value}</div>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2.5">
      <div className="type-caption text-muted-foreground">{label}</div>
      <div className="type-body mt-0.5">{children}</div>
    </div>
  );
}
