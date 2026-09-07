"use client";

import * as React from "react";
import { ChevronDown, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TomanIcon } from "@/components/ui/toman-icon";
import { QUOTE_CHANNELS } from "@/lib/format";
import { activeFilterCount, EMPTY_QUOTE_FILTERS } from "@/lib/quote-filters";
import type {
  Provider,
  FreshnessFilter,
  QuoteChannel,
  QuoteFilterState,
  QuoteSort,
  WarrantyFilter,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const FRESHNESS_ITEMS: Array<{ value: FreshnessFilter; label: string }> = [
  { value: "all", label: "همه" },
  { value: "today", label: "امروز" },
  { value: "recent", label: "جدید" },
  { value: "stale", label: "نیاز به استعلام مجدد" },
  { value: "expired", label: "منقضی" },
];

const WARRANTY_ITEMS: Array<{ value: WarrantyFilter; label: string }> = [
  { value: "all", label: "مهم نیست" },
  { value: "with", label: "فقط دارای توضیح گارانتی" },
  { value: "without", label: "بدون توضیح گارانتی" },
];

const SORT_ITEMS: Array<{ value: QuoteSort; label: string }> = [
  { value: "priceAsc", label: "قیمت: کم به زیاد" },
  { value: "priceDesc", label: "قیمت: زیاد به کم" },
  { value: "newest", label: "جدیدترین استعلام" },
  { value: "delivery", label: "سریع‌ترین تحویل" },
];

const DELIVERY_ITEMS = [
  { value: "all", label: "مهم نیست" },
  { value: "0", label: "فوری" },
  { value: "3", label: "حداکثر ۳ روز" },
  { value: "7", label: "حداکثر ۷ روز" },
  { value: "14", label: "حداکثر ۱۴ روز" },
  { value: "30", label: "حداکثر ۳۰ روز" },
];

export function QuoteFilters({
  value,
  onChange,
  resultCount,
  totalCount,
  providers,
}: {
  value: QuoteFilterState;
  onChange: (value: QuoteFilterState) => void;
  resultCount: number;
  totalCount: number;
  providers: Provider[];
}) {
  const [open, setOpen] = React.useState(false);
  const count = activeFilterCount(value);
  const patch = <K extends keyof QuoteFilterState>(key: K, next: QuoteFilterState[K]) =>
    onChange({ ...value, [key]: next });

  const providerItems = React.useMemo(
    () => [
      { value: "all", label: "همه فروشنده‌ها" },
      ...providers.map((provider) => ({ value: provider.id, label: provider.name })),
    ],
    [providers]
  );
  const channelItems = React.useMemo(
    () => [
      { value: "all" as const, label: "همه روش‌ها" },
      ...QUOTE_CHANNELS,
    ],
    []
  );

  return (
    <div className="mb-4 rounded-2xl border border-border bg-card/70">
      <div className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(event) => patch("search", event.target.value)}
            placeholder="جست‌وجوی فروشنده، گارانتی، یادداشت..."
            className="pe-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={open ? "secondary" : "outline"}
            className="flex-1 sm:flex-none"
            onClick={() => setOpen((current) => !current)}
          >
            <SlidersHorizontal />
            فیلترها
            {count ? <Badge variant="default">{count.toLocaleString("fa-IR")}</Badge> : null}
            <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
          </Button>
          {count ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="پاک کردن فیلترها"
              onClick={() => onChange({ ...EMPTY_QUOTE_FILTERS })}
            >
              <RotateCcw />
            </Button>
          ) : null}
        </div>
      </div>

      {open ? (
        <div className="grid gap-4 border-t border-border p-3 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="فروشنده / ارائه‌دهنده">
            <Select<string>
              value={value.providerId}
              onValueChange={(next) => { if (next !== null) patch("providerId", next); }}
              items={providerItems}
            >
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه فروشنده‌ها</SelectItem>
                {providers.map((provider) => (
                  <SelectItem key={provider.id} value={provider.id}>{provider.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="روش استعلام">
            <Select<"all" | QuoteChannel>
              value={value.channel}
              onValueChange={(next) => { if (next !== null) patch("channel", next); }}
              items={channelItems}
            >
              <SelectTrigger className="h-10 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه روش‌ها</SelectItem>
                {QUOTE_CHANNELS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="تازگی قیمت">
            <Select<FreshnessFilter>
              value={value.freshness}
              onValueChange={(next) => { if (next !== null) patch("freshness", next); }}
              items={FRESHNESS_ITEMS}
            >
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FRESHNESS_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="گارانتی">
            <Select<WarrantyFilter>
              value={value.warranty}
              onValueChange={(next) => { if (next !== null) patch("warranty", next); }}
              items={WARRANTY_ITEMS}
            >
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {WARRANTY_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="مرتب‌سازی">
            <Select<QuoteSort>
              value={value.sort}
              onValueChange={(next) => { if (next !== null) patch("sort", next); }}
              items={SORT_ITEMS}
            >
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SORT_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <FormField label="حداقل قیمت">
            <MoneyFilter value={value.minPriceToman} onChange={(next) => patch("minPriceToman", next)} />
          </FormField>

          <FormField label="حداکثر قیمت">
            <MoneyFilter value={value.maxPriceToman} onChange={(next) => patch("maxPriceToman", next)} />
          </FormField>

          <FormField label="حداکثر زمان تحویل">
            <Select<string>
              value={value.maxDeliveryDays === null ? "all" : String(value.maxDeliveryDays)}
              onValueChange={(next) => { if (next !== null) patch("maxDeliveryDays", next === "all" ? null : Number(next)); }}
              items={DELIVERY_ITEMS}
            >
              <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {DELIVERY_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          <div className="grid grid-cols-2 gap-2 lg:col-span-1">
            <FormField label="از تاریخ">
              <DatePicker
                value={value.quotedFrom}
                onValueChange={(next) => patch("quotedFrom", next)}
                placeholder="از"
                drawerTitle="شروع بازه"
                clearable
              />
            </FormField>
            <FormField label="تا تاریخ">
              <DatePicker
                value={value.quotedTo}
                onValueChange={(next) => patch("quotedTo", next)}
                placeholder="تا"
                drawerTitle="پایان بازه"
                clearable
                min={value.quotedFrom}
              />
            </FormField>
          </div>
        </div>
      ) : null}

      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        {resultCount === totalCount
          ? `${totalCount.toLocaleString("fa-IR")} گزینه فعلی`
          : `${resultCount.toLocaleString("fa-IR")} از ${totalCount.toLocaleString("fa-IR")} گزینه`}
      </div>
    </div>
  );
}

function MoneyFilter({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <InputGroup className="h-10">
      <PriceInput
        data-slot="input-group-control"
        value={value}
        onValueChange={onChange}
        min={0}
        className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
      />
      <InputGroupAddon align="inline-end">
        <InputGroupText>
          <TomanIcon className="size-4" />
          <span className="sr-only">تومان</span>
        </InputGroupText>
      </InputGroupAddon>
    </InputGroup>
  );
}
