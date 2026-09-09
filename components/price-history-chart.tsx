"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, CircleDot, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HelpHint } from "@/components/help-hint";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCompactPersianDate, formatToman } from "@/lib/format";
import { latestQuotesByProvider, quoteTotal } from "@/lib/quote";
import type { Provider, Quote } from "@/lib/types";
import { cn } from "@/lib/utils";

const CHART_COLORS = [
  "var(--primary)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
];

type ChartMode = "latest" | "timeline";

export function PriceHistoryChart({
  quotes,
  providers,
}: {
  quotes: Quote[];
  providers: Provider[];
}) {
  const [mode, setMode] = React.useState<ChartMode>("latest");
  const [hiddenProviderIds, setHiddenProviderIds] = React.useState<string[]>([]);
  const providerById = React.useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider])),
    [providers]
  );
  const activeProviders = React.useMemo(
    () => providers.filter((provider) => quotes.some((quote) => quote.providerId === provider.id)),
    [providers, quotes]
  );

  const latestData = React.useMemo(
    () =>
      latestQuotesByProvider(quotes)
        .map((quote) => ({
          providerId: quote.providerId,
          name: providerById.get(quote.providerId)?.name ?? "فروشنده",
          total: quoteTotal(quote),
          quotedAt: quote.quotedAt,
          color: CHART_COLORS[Math.max(0, activeProviders.findIndex((provider) => provider.id === quote.providerId)) % CHART_COLORS.length],
        }))
        .sort((a, b) => a.total - b.total),
    [quotes, providerById, activeProviders]
  );

  const timelineByProvider = React.useMemo(
    () =>
      activeProviders.map((provider) => ({
        provider,
        data: quotes
          .filter((quote) => quote.providerId === provider.id)
          .map((quote) => ({
            timestamp: new Date(quote.quotedAt).getTime(),
            total: quoteTotal(quote),
          }))
          .filter((point) => Number.isFinite(point.timestamp))
          .sort((a, b) => a.timestamp - b.timestamp),
      })),
    [activeProviders, quotes]
  );

  function toggleProvider(id: string) {
    setHiddenProviderIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  if (!quotes.length) return null;

  const repeatedProviders = timelineByProvider.filter((series) => series.data.length > 1).length;

  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border p-4 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-center gap-1.5">
            <h2 className="type-section-title">نمودار قیمت‌ها</h2>
            <HelpHint label="راهنمای نمودار قیمت‌ها">
              برای مقایسه سریع، نمودار میله‌ای آخرین قیمت‌ها را ببین؛ برای دیدن همه استعلام‌ها در طول زمان، حالت نقطه‌ای را باز کن.
            </HelpHint>
          </div>

          <div className="inline-flex w-fit rounded-xl border border-border bg-muted/35 p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === "latest" ? "secondary" : "ghost"}
              onClick={() => setMode("latest")}
            >
              <BarChart3 />آخرین قیمت‌ها
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "timeline" ? "secondary" : "ghost"}
              onClick={() => setMode("timeline")}
            >
              <CircleDot />نقطه‌ای در زمان
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary">{activeProviders.length.toLocaleString("fa-IR-u-nu-arabext")} فروشنده</Badge>
          <Badge variant="outline">{quotes.length.toLocaleString("fa-IR-u-nu-arabext")} استعلام</Badge>
          {repeatedProviders ? (
            <Badge variant="outline">{repeatedProviders.toLocaleString("fa-IR-u-nu-arabext")} فروشنده با بیش از یک قیمت</Badge>
          ) : null}
        </div>

        {mode === "timeline" ? (
          <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {activeProviders.map((provider, index) => {
                const visible = !hiddenProviderIds.includes(provider.id);
                return (
                  <Button
                    key={provider.id}
                    type="button"
                    size="sm"
                    variant={visible ? "secondary" : "outline"}
                    aria-pressed={visible}
                    onClick={() => toggleProvider(provider.id)}
                    className={cn("rounded-full", !visible && "opacity-60")}
                  >
                    <span
                      aria-hidden
                      className="size-2.5 rounded-full"
                      style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    {provider.name}
                  </Button>
                );
              })}
            </div>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => setHiddenProviderIds([])}>
                <Eye />همه
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setHiddenProviderIds(activeProviders.map((provider) => provider.id))}
              >
                <EyeOff />هیچ‌کدام
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {mode === "latest" ? (
        <LatestPriceBars data={latestData} />
      ) : (
        <TimelineScatter
          series={timelineByProvider}
          hiddenProviderIds={hiddenProviderIds}
        />
      )}
    </Card>
  );
}

function LatestPriceBars({
  data,
}: {
  data: Array<{
    providerId: string;
    name: string;
    total: number;
    quotedAt: string;
    color: string;
  }>;
}) {
  const height = Math.max(300, Math.min(560, data.length * 58 + 96));

  return (
    <div className="w-full p-2 sm:p-4" dir="ltr" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 12, right: 18, left: 8, bottom: 10 }}
        >
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(value) => compactAxisValue(Number(value))}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: "var(--foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={104}
            interval={0}
          />
          <Tooltip
            formatter={(value) => [`${formatToman(Number(value))} تومان`, "قیمت نهایی"]}
            labelFormatter={(label, payload) => {
              const point = payload?.[0]?.payload as { quotedAt?: string } | undefined;
              return point?.quotedAt ? `${String(label)} · ${formatCompactPersianDate(point.quotedAt)}` : String(label);
            }}
            contentStyle={tooltipStyle}
          />
          <Bar dataKey="total" name="قیمت نهایی" radius={[0, 8, 8, 0]} maxBarSize={34}>
            {data.map((item) => (
              <Cell key={item.providerId} fill={item.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TimelineScatter({
  series,
  hiddenProviderIds,
}: {
  series: Array<{
    provider: Provider;
    data: Array<{ timestamp: number; total: number }>;
  }>;
  hiddenProviderIds: string[];
}) {
  const visible = series.filter((item) => !hiddenProviderIds.includes(item.provider.id));

  if (!visible.length) {
    return (
      <div className="grid min-h-72 place-items-center p-6 text-center">
        <div>
          <EyeOff className="mx-auto size-6 text-muted-foreground" />
          <p className="type-label mt-2">همه فروشنده‌ها مخفی‌اند</p>
          <p className="type-caption mt-1 text-muted-foreground">از بالای نمودار «همه» را بزن یا یک فروشنده را دوباره روشن کن.</p>
        </div>
      </div>
    );
  }

  const allTimestamps = visible.flatMap((item) => item.data.map((point) => point.timestamp));
  const singleDate = allTimestamps.length > 0 && Math.min(...allTimestamps) === Math.max(...allTimestamps);
  const day = 86_400_000;
  const domain: [number | "dataMin", number | "dataMax"] = singleDate
    ? [allTimestamps[0] - day, allTimestamps[0] + day]
    : ["dataMin", "dataMax"];

  return (
    <div>
      <div className="h-[350px] w-full p-2 sm:h-[430px] sm:p-4" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 12, left: 8, bottom: 18 }}>
            <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
            <XAxis
              type="number"
              dataKey="timestamp"
              domain={domain}
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={{ stroke: "var(--border)" }}
              tickLine={false}
              tickFormatter={(value) => formatCompactPersianDate(new Date(Number(value)))}
              minTickGap={32}
            />
            <YAxis
              type="number"
              dataKey="total"
              tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={72}
              tickFormatter={(value) => compactAxisValue(Number(value))}
            />
            <Tooltip
              formatter={(value, name) => [
                name === "timestamp"
                  ? formatCompactPersianDate(new Date(Number(value)))
                  : `${formatToman(Number(value))} تومان`,
                name === "timestamp" ? "تاریخ" : "قیمت نهایی",
              ]}
              contentStyle={tooltipStyle}
              cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
            />
            <Legend wrapperStyle={{ fontFamily: "Mikhak", fontSize: 12 }} />
            {series.map((item, index) =>
              hiddenProviderIds.includes(item.provider.id) ? null : (
                <Scatter
                  key={item.provider.id}
                  name={item.provider.name}
                  data={item.data}
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                  line={
                    item.data.length > 1
                      ? { stroke: CHART_COLORS[index % CHART_COLORS.length], strokeWidth: 2 }
                      : false
                  }
                />
              )
            )}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {visible.length > 0 && visible.every((item) => item.data.length <= 1) ? (
        <p className="type-caption border-t border-border px-4 py-3 text-muted-foreground sm:px-5">
          فعلاً از هر فروشنده فقط یک قیمت داری؛ با «استعلام مجدد» نقاط بعدی اضافه می‌شوند و روند هر فروشنده روی همین نمودار شکل می‌گیرد.
        </p>
      ) : null}
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  color: "var(--popover-foreground)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontFamily: "Mikhak",
  direction: "rtl" as const,
};

function compactAxisValue(value: number) {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 1 })} میلیارد`;
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 1 })} م`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 0 })} ه`;
  }
  return value.toLocaleString("fa-IR-u-nu-arabext");
}
