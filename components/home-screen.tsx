"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChartNoAxesCombined,
  CirclePlus,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
} from "lucide-react";
import { CaseCard } from "@/components/case-card";
import { CreateCaseDialog } from "@/components/create-case-dialog";
import { EmptyState } from "@/components/empty-state";
import { TodayQueue } from "@/components/today-queue";
import { MonthlyBudgetSummary } from "@/components/monthly-budget-summary";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  applyHomeCaseFilters,
  caseNeedsFollowUp,
  type HomeCaseHealthFilter,
  type HomeCaseKindFilter,
  type HomeCaseSort,
} from "@/lib/case-filters";
import { db } from "@/lib/db";
import { buildMonthlyBudgetSnapshot } from "@/lib/budget";
import { collectCategoryOptions, collectTagOptions } from "@/lib/categories";
import { buildDashboardTasks } from "@/lib/follow-up";
import type { PurchaseStatus } from "@/lib/types";

const statusTabs: Array<{ value: PurchaseStatus; label: string }> = [
  { value: "active", label: "فعال" },
  { value: "decided", label: "تصمیم‌گرفته" },
  { value: "archived", label: "آرشیو" },
];

const KIND_ITEMS: Array<{ value: HomeCaseKindFilter; label: string }> = [
  { value: "all", label: "همه نوع‌ها" },
  { value: "product", label: "کالا" },
  { value: "service", label: "خدمت" },
];

const HEALTH_ITEMS: Array<{ value: HomeCaseHealthFilter; label: string }> = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "followUp", label: "نیاز به پیگیری" },
  { value: "withQuotes", label: "دارای استعلام" },
  { value: "withoutQuotes", label: "بدون استعلام" },
];

const SORT_ITEMS: Array<{ value: HomeCaseSort; label: string }> = [
  { value: "updated", label: "آخرین تغییر" },
  { value: "newestQuote", label: "جدیدترین استعلام" },
  { value: "quotes", label: "بیشترین استعلام" },
  { value: "lowestPrice", label: "کمترین قیمت" },
];

export function HomeScreen() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [status, setStatus] = React.useState<PurchaseStatus>("active");
  const [search, setSearch] = React.useState("");
  const [kind, setKind] = React.useState<HomeCaseKindFilter>("all");
  const [categoryKey, setCategoryKey] = React.useState("all");
  const [tag, setTag] = React.useState("all");
  const [health, setHealth] = React.useState<HomeCaseHealthFilter>("all");
  const [sort, setSort] = React.useState<HomeCaseSort>("updated");

  const data = useLiveQuery(async () => {
    const [cases, quotes, reminders, budgetPlan] = await Promise.all([
      db.purchaseCases.orderBy("updatedAt").reverse().toArray(),
      db.quotes.toArray(),
      db.reminders.toArray(),
      db.budgetPlans.get("monthly"),
    ]);
    return { cases, quotes, reminders, budgetPlan };
  }, []);

  if (!data) return <HomeSkeleton />;

  const quoteMap = new Map<string, typeof data.quotes>();
  for (const quote of data.quotes) {
    const rows = quoteMap.get(quote.caseId) ?? [];
    rows.push(quote);
    quoteMap.set(quote.caseId, rows);
  }

  const filteredCases = applyHomeCaseFilters(data.cases, data.quotes, {
    status,
    search,
    kind,
    categoryKey,
    tag,
    health,
    sort,
  });
  const casesInStatus = data.cases.filter((row) => row.status === status);
  const activeCases = data.cases.filter((row) => row.status === "active");
  const staleCount = activeCases.filter((row) =>
    caseNeedsFollowUp(quoteMap.get(row.id) ?? [])
  ).length;
  const activeCount = activeCases.length;
  const decidedCount = data.cases.filter((row) => row.status === "decided").length;
  const purchasedCount = data.cases.filter((row) => Boolean(row.purchaseOutcome)).length;
  const dashboardTasks = buildDashboardTasks(data.cases, data.quotes, data.reminders);
  const categoryOptions = collectCategoryOptions(data.cases, { includeUncategorized: true });
  const tagOptions = collectTagOptions(data.cases);
  const budgetSnapshot = buildMonthlyBudgetSnapshot(data.cases, data.budgetPlan);
  const activeFilterCount =
    Number(Boolean(search.trim())) +
    Number(kind !== "all") +
    Number(categoryKey !== "all") +
    Number(tag !== "all") +
    Number(health !== "all") +
    Number(sort !== "updated");

  function clearFilters() {
    setSearch("");
    setKind("all");
    setCategoryKey("all");
    setTag("all");
    setHealth("all");
    setSort("updated");
  }

  return (
    <>
      <section className="mb-6 overflow-hidden rounded-3xl border border-border/90 bg-card/72 shadow-[0_18px_60px_color-mix(in_oklab,var(--foreground)_5%,transparent)] sm:mb-7">
        <div className="relative p-5 sm:p-7">
          <div
            className="pointer-events-none absolute inset-y-0 end-0 w-1/2 bg-[radial-gradient(circle_at_70%_10%,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Sparkles className="size-3.5" />
                دفتر شخصی استعلام قیمت
              </div>
              <h1 className="type-page-title max-w-2xl">
                از اولین استعلام تا نتیجه واقعی خرید، همه‌چیز یک‌جا.
              </h1>
              <p className="type-body mt-2 max-w-2xl text-muted-foreground">
                قیمت بگیر، مقایسه کن، پیگیری‌ها را انجام بده و بعد مبلغ واقعی و تحویل خرید را هم کنار همان پرونده نگه دار.
              </p>
            </div>

            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <Button
                nativeButton={false}
                render={<Link href="/insights" />}
                size="lg"
                variant="outline"
              >
                <ChartNoAxesCombined />
                بینش خرید
              </Button>
              <Button
                type="button"
                size="lg"
                className="shadow-md"
                onClick={() => setCreateOpen(true)}
              >
                <CirclePlus />
                پرونده جدید
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-border/80 sm:grid-cols-5">
          <SummaryMetric label="پرونده فعال" value={activeCount} />
          <SummaryMetric label="کل استعلام‌ها" value={data.quotes.length} />
          <SummaryMetric
            label="نیاز به پیگیری"
            value={staleCount}
            alert={staleCount > 0}
          />
          <SummaryMetric label="تصمیم نهایی" value={decidedCount} />
          <SummaryMetric label="خرید ثبت‌شده" value={purchasedCount} />
        </div>
      </section>

      <TodayQueue tasks={dashboardTasks} />
      <MonthlyBudgetSummary snapshot={budgetSnapshot} />

      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as PurchaseStatus)}
        variant="default"
      >
        <div className="flex items-center justify-between gap-3">
          <TabsList className="max-w-full overflow-x-auto hide-scrollbar">
            {statusTabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
                <span className="type-data opacity-65">
                  {data.cases
                    .filter((row) => row.status === tab.value)
                    .length.toLocaleString("fa-IR")}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <Card className="overflow-hidden border-border/90 bg-card/75 shadow-sm">
          <div className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(14rem,1fr)_9rem_10.5rem_9.5rem_10.5rem_10.5rem_auto] sm:items-center">
            <div className="relative">
              <Search className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="جست‌وجوی نام یا توضیح پرونده..."
                className="pe-9"
              />
            </div>

            <Select<HomeCaseKindFilter>
              value={kind}
              onValueChange={(next) => { if (next !== null) setKind(next); }}
              items={KIND_ITEMS}
            >
              <SelectTrigger aria-label="فیلتر نوع پرونده">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KIND_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select<string>
              value={categoryKey}
              onValueChange={(next) => { if (next !== null) setCategoryKey(next); }}
              items={[
                { value: "all", label: "همه دسته‌ها" },
                ...categoryOptions.map((item) => ({ value: item.key, label: item.label })),
              ]}
            >
              <SelectTrigger aria-label="فیلتر دسته‌بندی">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه دسته‌ها</SelectItem>
                {categoryOptions.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select<string>
              value={tag}
              onValueChange={(next) => { if (next !== null) setTag(next); }}
              items={[
                { value: "all", label: "همه برچسب‌ها" },
                ...tagOptions.map((item) => ({ value: item, label: item })),
              ]}
            >
              <SelectTrigger aria-label="فیلتر برچسب">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه برچسب‌ها</SelectItem>
                {tagOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select<HomeCaseHealthFilter>
              value={health}
              onValueChange={(next) => { if (next !== null) setHealth(next); }}
              items={HEALTH_ITEMS}
            >
              <SelectTrigger aria-label="فیلتر وضعیت استعلام">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {HEALTH_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select<HomeCaseSort>
              value={sort}
              onValueChange={(next) => { if (next !== null) setSort(next); }}
              items={SORT_ITEMS}
            >
              <SelectTrigger aria-label="مرتب‌سازی پرونده‌ها">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="پاک کردن فیلترها"
                title="پاک کردن فیلترها"
                onClick={clearFilters}
              >
                <RotateCcw />
              </Button>
            ) : (
              <div className="hidden size-10 place-items-center text-muted-foreground sm:grid">
                <Filter className="size-4" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/75 bg-muted/25 px-3 py-2.5">
            <span className="type-caption text-muted-foreground">
              نمایش {filteredCases.length.toLocaleString("fa-IR")} از {casesInStatus.length.toLocaleString("fa-IR")} پرونده
            </span>
            {activeFilterCount ? (
              <span className="type-caption inline-flex items-center gap-1 text-primary">
                <Filter className="size-3.5" />
                {activeFilterCount.toLocaleString("fa-IR")} فیلتر فعال
              </span>
            ) : null}
          </div>
        </Card>

        {statusTabs.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {filteredCases.length ? (
              <div className="grid auto-rows-fr gap-3 lg:grid-cols-2">
                {filteredCases.map((purchaseCase) => (
                  <CaseCard
                    key={purchaseCase.id}
                    purchaseCase={purchaseCase}
                    quotes={quoteMap.get(purchaseCase.id) ?? []}
                  />
                ))}
              </div>
            ) : casesInStatus.length ? (
              <EmptyState
                title="پرونده‌ای با این فیلترها پیدا نشد"
                description="عبارت جست‌وجو یا فیلترهای بالا را تغییر بده. اطلاعات پرونده‌ها دست‌نخورده می‌ماند."
                action={
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    <RotateCcw />
                    پاک کردن فیلترها
                  </Button>
                }
              />
            ) : (
              <EmptyState
                title={emptyTitle(tab.value)}
                description={emptyDescription(tab.value)}
                action={
                  tab.value === "active" ? (
                    <Button type="button" onClick={() => setCreateOpen(true)}>
                      <CirclePlus />
                      ساخت اولین پرونده
                    </Button>
                  ) : undefined
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>

      <Button
        type="button"
        size="lg"
        className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] end-4 z-30 rounded-2xl shadow-xl sm:hidden"
        onClick={() => setCreateOpen(true)}
      >
        <CirclePlus />
        پرونده جدید
      </Button>

      <CreateCaseDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}

function SummaryMetric({
  label,
  value,
  alert = false,
}: {
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className="relative min-h-20 border-e border-border/70 px-4 py-3.5 last:border-e-0 sm:min-h-24 sm:px-5 sm:py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="type-caption text-muted-foreground">{label}</span>
        {alert ? (
          <RefreshCw className="size-3.5 text-amber-600 dark:text-amber-300" />
        ) : null}
      </div>
      <div className="type-data mt-1.5 text-xl sm:text-2xl">
        {value.toLocaleString("fa-IR")}
      </div>
    </div>
  );
}

function emptyTitle(status: PurchaseStatus) {
  if (status === "active") return "هنوز پرونده فعالی نداری";
  if (status === "decided") return "هنوز خریدی را نهایی نکرده‌ای";
  return "آرشیو خالی است";
}

function emptyDescription(status: PurchaseStatus) {
  if (status === "active")
    return "برای خرید یا خدمتی که در حال قیمت‌گرفتن برایش هستی، یک پرونده بساز.";
  if (status === "decided")
    return "وقتی یکی از استعلام‌ها را انتخاب کنی، پرونده اینجا قرار می‌گیرد.";
  return "پرونده‌هایی که فعلاً لازم نداری می‌توانند اینجا بمانند.";
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-52 rounded-3xl bg-muted" />
      <div className="h-24 rounded-2xl bg-muted" />
      <div className="grid auto-rows-fr gap-3 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-64 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
