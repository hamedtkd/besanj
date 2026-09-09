"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowLeft,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  PiggyBank,
  ReceiptText,
  Star,
  Store,
  Target,
  Tags,
  Truck,
  WalletCards,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BudgetOverview } from "@/components/budget-overview";
import { HelpHint } from "@/components/help-hint";
import { PersonalPriceIntelligence } from "@/components/personal-price-intelligence";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db } from "@/lib/db";
import { buildMonthlyBudgetSnapshot } from "@/lib/budget";
import { collectCategoryOptions, collectTagOptions } from "@/lib/categories";
import { formatInteger, formatPersianDate, formatPhone, formatToman } from "@/lib/format";
import { buildPurchaseInsights } from "@/lib/insights";
import { cn } from "@/lib/utils";

export function InsightsPage() {
  const [categoryKey, setCategoryKey] = React.useState("all");
  const [tag, setTag] = React.useState("all");

  const data = useLiveQuery(async () => {
    const [cases, quotes, providers, sellerProfiles, budgetPlan] = await Promise.all([
      db.purchaseCases.toArray(),
      db.quotes.toArray(),
      db.providers.toArray(),
      db.sellerProfiles.toArray(),
      db.budgetPlans.get("monthly"),
    ]);
    return { cases, quotes, providers, sellerProfiles, budgetPlan };
  }, []);

  if (!data) return <InsightsSkeleton />;

  const categoryOptions = collectCategoryOptions(data.cases, { includeUncategorized: true });
  const tagOptions = collectTagOptions(data.cases);
  const insights = buildPurchaseInsights(data.cases, data.quotes, data.providers, {
    categoryKey,
    tag,
  });
  const budgetSnapshot = buildMonthlyBudgetSnapshot(data.cases, data.budgetPlan);
  const { summary } = insights;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border/90 bg-card/76 shadow-[0_18px_60px_color-mix(in_oklab,var(--foreground)_5%,transparent)]">
        <div className="relative p-5 sm:p-7">
          <div
            className="pointer-events-none absolute inset-y-0 end-0 w-1/2 bg-[radial-gradient(circle_at_70%_10%,color-mix(in_oklab,var(--primary)_13%,transparent),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <ChartNoAxesCombined className="size-3.5" />
                بینش‌های خرید
              </div>
              <div className="flex items-center gap-1.5">
                <h1 className="type-page-title">از خریدهای قبلی یاد بگیر.</h1>
                <HelpHint label="راهنمای بینش‌های خرید" side="bottom">
                  هزینه واقعی، صرفه‌جویی، سرعت تصمیم و سابقه فروشنده‌ها را یک‌جا ببین تا خرید بعدی را با حافظه بهتر شروع کنی.
                </HelpHint>
              </div>
            </div>
            <Button
              nativeButton={false}
              render={<Link href="/" />}
              variant="outline"
              className="w-fit"
            >
              پرونده‌ها
              <ArrowLeft />
            </Button>
          </div>
        </div>
      </section>

      <BudgetOverview cases={data.cases} plan={data.budgetPlan} snapshot={budgetSnapshot} />

      <Card className="p-3 sm:p-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-center">
          <Select<string>
            value={categoryKey}
            onValueChange={(value) => { if (value !== null) setCategoryKey(value); }}
            items={[
              { value: "all", label: "همه دسته‌ها" },
              ...categoryOptions.map((item) => ({ value: item.key, label: item.label })),
            ]}
          >
            <SelectTrigger aria-label="فیلتر دسته‌بندی بینش‌ها">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه دسته‌ها</SelectItem>
              {categoryOptions.map((item) => (
                <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select<string>
            value={tag}
            onValueChange={(value) => { if (value !== null) setTag(value); }}
            items={[
              { value: "all", label: "همه برچسب‌ها" },
              ...tagOptions.map((item) => ({ value: item, label: item })),
            ]}
          >
            <SelectTrigger aria-label="فیلتر برچسب بینش‌ها">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه برچسب‌ها</SelectItem>
              {tagOptions.map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="type-caption flex items-center gap-1.5 text-muted-foreground lg:justify-end">
            <Tags className="size-3.5" />
            {summary.purchaseCount.toLocaleString("fa-IR-u-nu-arabext")} خرید در این نما
          </div>
        </div>
      </Card>

      <PersonalPriceIntelligence
        cases={data.cases}
        quotes={data.quotes}
        providers={data.providers}
        sellerProfiles={data.sellerProfiles}
        categoryKey={categoryKey}
        tag={tag}
      />

      {summary.purchaseCount === 0 ? (
        <EmptyInsights />
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InsightMetric
              icon={WalletCards}
              label="هزینه واقعی خریدها"
              value={formatToman(summary.totalSpentToman)}
              suffix="تومان"
            />
            <InsightMetric
              icon={PiggyBank}
              label="صرفه‌جویی نسبت به گران‌ترین گزینه"
              value={formatToman(summary.totalSavingsVsHighestToman)}
              suffix="تومان"
              positive={summary.totalSavingsVsHighestToman > 0}
            />
            <InsightMetric
              icon={Truck}
              label="تحویل به‌موقع"
              value={
                summary.onTimeDeliveryRate === null
                  ? "—"
                  : `${Math.round(summary.onTimeDeliveryRate * 100).toLocaleString("fa-IR-u-nu-arabext")}٪`
              }
              detail={
                summary.deliveryMeasuredCount
                  ? `${summary.onTimeDeliveryCount.toLocaleString("fa-IR-u-nu-arabext")} از ${summary.deliveryMeasuredCount.toLocaleString("fa-IR-u-nu-arabext")} خرید قابل سنجش`
                  : "هنوز تحویل ثبت‌شده کافی نیست"
              }
            />
            <InsightMetric
              icon={ReceiptText}
              label="میانگین استعلام قبل از خرید"
              value={summary.averageQuotesPerPurchase.toLocaleString("fa-IR-u-nu-arabext", {
                maximumFractionDigits: 1,
              })}
              detail={`${summary.purchaseCount.toLocaleString("fa-IR-u-nu-arabext")} خرید ثبت‌شده`}
            />
          </section>

          <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.6fr)]">
            <SpendChart data={insights.monthlySpend} />
            <DecisionSnapshot
              averageDecisionDays={summary.averageDecisionDays}
              withinBudgetCount={summary.withinBudgetCount}
              overBudgetCount={summary.overBudgetCount}
              totalDifferenceFromQuoteToman={summary.totalDifferenceFromQuoteToman}
            />
          </section>

          <CategorySpendChart data={insights.categorySpend} />

          {(insights.largestSaving || insights.largestOverBudget || insights.mostUsedSeller) && (
            <section className="grid gap-3 lg:grid-cols-3">
              {insights.largestSaving ? (
                <HighlightCard
                  icon={PiggyBank}
                  title="بیشترین صرفه‌جویی"
                  value={`${formatToman(insights.largestSaving.savingsVsHighestToman)} تومان`}
                  detail={insights.largestSaving.title}
                  href={`/cases/${insights.largestSaving.caseId}`}
                />
              ) : null}
              {insights.largestOverBudget ? (
                <HighlightCard
                  icon={Target}
                  title="بیشترین عبور از بودجه"
                  value={`${formatToman(insights.largestOverBudget.differenceFromBudgetToman ?? 0)} تومان`}
                  detail={insights.largestOverBudget.title}
                  href={`/cases/${insights.largestOverBudget.caseId}`}
                  warning
                />
              ) : null}
              {insights.mostUsedSeller ? (
                <HighlightCard
                  icon={Store}
                  title="فروشنده پرتکرار"
                  value={insights.mostUsedSeller.name}
                  detail={`${insights.mostUsedSeller.purchaseCount.toLocaleString("fa-IR-u-nu-arabext")} خرید · ${insights.mostUsedSeller.quoteCount.toLocaleString("fa-IR-u-nu-arabext")} استعلام`}
                />
              ) : null}
            </section>
          )}

          <SellerMemory sellers={insights.sellers.slice(0, 8)} />
          <RecentPurchases purchases={insights.purchases.slice(0, 10)} />
        </>
      )}
    </div>
  );
}

function InsightMetric({
  icon: Icon,
  label,
  value,
  suffix,
  detail,
  positive,
}: {
  icon: typeof WalletCards;
  label: string;
  value: string;
  suffix?: string;
  detail?: string;
  positive?: boolean;
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            positive
              ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="type-caption text-muted-foreground">{label}</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-1.5">
            <strong className="type-data text-xl sm:text-2xl">{value}</strong>
            {suffix ? <span className="type-caption text-muted-foreground">{suffix}</span> : null}
          </div>
          {detail ? <p className="type-caption mt-1 text-muted-foreground">{detail}</p> : null}
        </div>
      </div>
    </Card>
  );
}

function SpendChart({
  data,
}: {
  data: Array<{ key: string; label: string; totalToman: number; purchaseCount: number }>;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border/80 p-4 sm:p-5">
        <h2 className="type-section-title">روند هزینه خرید</h2>
        <HelpHint label="راهنمای روند هزینه خرید">
          جمع مبلغ واقعی خریدهای ثبت‌شده در هر ماه؛ حداکثر ۱۲ ماه اخیر.
        </HelpHint>
      </div>
      {data.length ? (
        <div className="h-80 w-full p-3 sm:p-4" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={72}
                tickFormatter={(value) => compactAxisValue(Number(value))}
              />
              <Tooltip
                formatter={(value) => [`${formatToman(Number(value))} تومان`, "هزینه واقعی"]}
                labelFormatter={(label, payload) => {
                  const point = payload?.[0]?.payload as { purchaseCount?: number } | undefined;
                  return point?.purchaseCount
                    ? `${String(label)} · ${point.purchaseCount.toLocaleString("fa-IR-u-nu-arabext")} خرید`
                    : String(label);
                }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="totalToman" fill="var(--primary)" radius={[7, 7, 0, 0]} maxBarSize={42} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid min-h-56 place-items-center p-6 text-center">
          <p className="type-caption text-muted-foreground">داده ماهانه کافی نیست.</p>
        </div>
      )}
    </Card>
  );
}

function CategorySpendChart({
  data,
}: {
  data: Array<{ key: string; label: string; totalToman: number; purchaseCount: number }>;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border/80 p-4 sm:p-5">
        <h2 className="type-section-title">هزینه بر اساس دسته</h2>
        <HelpHint label="راهنمای هزینه دسته‌ها">
          مبلغ واقعی خریدها را بر اساس دسته‌بندی پرونده‌ها کنار هم ببین.
        </HelpHint>
      </div>
      {data.length ? (
        <div className="h-80 w-full p-3 sm:p-4" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 4 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={72}
                tickFormatter={(value) => compactAxisValue(Number(value))}
              />
              <Tooltip
                formatter={(value) => [`${formatToman(Number(value))} تومان`, "هزینه واقعی"]}
                labelFormatter={(label, payload) => {
                  const point = payload?.[0]?.payload as { purchaseCount?: number } | undefined;
                  return point?.purchaseCount
                    ? `${String(label)} · ${point.purchaseCount.toLocaleString("fa-IR-u-nu-arabext")} خرید`
                    : String(label);
                }}
                contentStyle={tooltipStyle}
              />
              <Bar dataKey="totalToman" fill="var(--primary)" radius={[7, 7, 0, 0]} maxBarSize={52} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="grid min-h-48 place-items-center p-6 text-center">
          <p className="type-caption text-muted-foreground">داده دسته‌بندی کافی نیست.</p>
        </div>
      )}
    </Card>
  );
}

function DecisionSnapshot({
  averageDecisionDays,
  withinBudgetCount,
  overBudgetCount,
  totalDifferenceFromQuoteToman,
}: {
  averageDecisionDays: number | null;
  withinBudgetCount: number;
  overBudgetCount: number;
  totalDifferenceFromQuoteToman: number;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border/80 p-4 sm:p-5">
        <h2 className="type-section-title">رفتار خرید تو</h2>
        <HelpHint label="راهنمای رفتار خرید">
          چند شاخص ساده برای بهترکردن تصمیم‌های بعدی.
        </HelpHint>
      </div>
      <div className="divide-y divide-border/70">
        <SnapshotRow
          icon={Clock3}
          label="میانگین زمان تا خرید"
          value={
            averageDecisionDays === null
              ? "—"
              : `${averageDecisionDays.toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 1 })} روز`
          }
        />
        <SnapshotRow
          icon={Target}
          label="خریدهای داخل بودجه"
          value={`${withinBudgetCount.toLocaleString("fa-IR-u-nu-arabext")} مورد`}
          detail={overBudgetCount ? `${overBudgetCount.toLocaleString("fa-IR-u-nu-arabext")} مورد بالاتر از بودجه` : "عبور ثبت‌شده از بودجه نداری"}
        />
        <SnapshotRow
          icon={CircleDollarSign}
          label="اختلاف کل پرداخت با قیمت انتخابی"
          value={`${totalDifferenceFromQuoteToman > 0 ? "+" : ""}${formatToman(totalDifferenceFromQuoteToman)} تومان`}
          detail={totalDifferenceFromQuoteToman > 0 ? "در مجموع بیشتر از قیمت ثبت‌شده پرداخت شده" : totalDifferenceFromQuoteToman < 0 ? "در مجموع کمتر از قیمت ثبت‌شده پرداخت شده" : "مبلغ واقعی با استعلام‌های انتخابی برابر بوده"}
        />
      </div>
    </Card>
  );
}

function SnapshotRow({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="flex gap-3 p-4 sm:p-5">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="type-caption text-muted-foreground">{label}</p>
        <div className="type-label mt-0.5">{value}</div>
        {detail ? <p className="type-caption mt-1 text-muted-foreground">{detail}</p> : null}
      </div>
    </div>
  );
}

function HighlightCard({
  icon: Icon,
  title,
  value,
  detail,
  href,
  warning,
}: {
  icon: typeof PiggyBank;
  title: string;
  value: string;
  detail: string;
  href?: string;
  warning?: boolean;
}) {
  const content = (
    <Card className="h-full p-4 transition hover:border-primary/35 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-2xl",
            warning
              ? "bg-amber-500/12 text-amber-700 dark:text-amber-300"
              : "bg-primary/10 text-primary"
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0">
          <p className="type-caption text-muted-foreground">{title}</p>
          <div className="type-card-title mt-1 truncate">{value}</div>
          <p className="type-caption mt-1 truncate text-muted-foreground">{detail}</p>
        </div>
      </div>
    </Card>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function SellerMemory({
  sellers,
}: {
  sellers: Array<{
    key: string;
    sellerProfileId?: string;
    name: string;
    phone?: string;
    caseCount: number;
    quoteCount: number;
    purchaseCount: number;
    totalSpentToman: number;
    averageRating: number | null;
    winRate: number;
    deliveryMeasuredCount: number;
    onTimeDeliveryCount: number;
  }>;
}) {
  if (!sellers.length) return null;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border/80 p-4 sm:p-5">
        <h2 className="type-section-title">حافظه فروشنده‌ها</h2>
        <HelpHint label="راهنمای حافظه فروشنده‌ها">
          پروفایل سراسری فروشنده‌ها، سابقه خرید و امتیاز را بین پرونده‌های مختلف یک‌جا نگه می‌دارد.
        </HelpHint>
      </div>
      <div className="divide-y divide-border/70">
        {sellers.map((seller, index) => {
          const onTimeRate = seller.deliveryMeasuredCount
            ? Math.round((seller.onTimeDeliveryCount / seller.deliveryMeasuredCount) * 100)
            : null;
          return (
            <div key={seller.key} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                  {index + 1 <= 3 ? <Star className="size-4" /> : <Store className="size-4" />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="type-label truncate">
                      {seller.sellerProfileId ? (
                        <Link href={`/sellers/${seller.sellerProfileId}`} className="hover:text-primary">
                          {seller.name}
                        </Link>
                      ) : (
                        seller.name
                      )}
                    </strong>
                    {seller.averageRating !== null ? (
                      <Badge variant="secondary">
                        {seller.averageRating.toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 1 })} از ۵
                      </Badge>
                    ) : null}
                  </div>
                  <p className="type-caption mt-1 text-muted-foreground">
                    {seller.phone ? `${formatPhone(seller.phone)} · ` : ""}
                    {seller.caseCount.toLocaleString("fa-IR-u-nu-arabext")} پرونده · {seller.quoteCount.toLocaleString("fa-IR-u-nu-arabext")} استعلام
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Badge variant={seller.purchaseCount ? "default" : "outline"}>
                  {seller.purchaseCount.toLocaleString("fa-IR-u-nu-arabext")} خرید
                </Badge>
                {seller.totalSpentToman ? (
                  <Badge variant="outline">{formatToman(seller.totalSpentToman)} تومان</Badge>
                ) : null}
                {onTimeRate !== null ? (
                  <Badge variant="outline">تحویل به‌موقع {onTimeRate.toLocaleString("fa-IR-u-nu-arabext")}٪</Badge>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function RecentPurchases({
  purchases,
}: {
  purchases: Array<{
    caseId: string;
    title: string;
    purchasedAt: string;
    actualPaidToman: number;
    providerName: string;
    categoryLabel: string;
    differenceFromBudgetToman: number | null;
    savingsVsHighestToman: number;
    status: "ordered" | "received";
  }>;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="border-b border-border/80 p-4 sm:p-5">
        <h2 className="type-section-title">خریدهای اخیر</h2>
        <p className="type-caption mt-1 text-muted-foreground">
          نتیجه خریدها را با بودجه و بازار همان پرونده مرور کن.
        </p>
      </div>
      <div className="divide-y divide-border/70">
        {purchases.map((purchase) => (
          <Link
            key={purchase.caseId}
            href={`/cases/${purchase.caseId}`}
            className="grid gap-3 p-4 transition hover:bg-muted/25 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="type-label truncate">{purchase.title}</strong>
                <Badge variant={purchase.status === "received" ? "secondary" : "outline"}>
                  {purchase.status === "received" ? "دریافت شده" : "سفارش ثبت شده"}
                </Badge>
                <Badge variant="outline">{purchase.categoryLabel}</Badge>
              </div>
              <p className="type-caption mt-1 text-muted-foreground">
                {purchase.providerName} · {formatPersianDate(purchase.purchasedAt)}
              </p>
            </div>
            <div className="sm:text-end">
              <div className="type-data">{formatToman(purchase.actualPaidToman)} تومان</div>
              <div className="mt-1 flex flex-wrap gap-1 sm:justify-end">
                {purchase.savingsVsHighestToman > 0 ? (
                  <span className="type-caption text-emerald-700 dark:text-emerald-300">
                    {formatToman(purchase.savingsVsHighestToman)} صرفه‌جویی
                  </span>
                ) : null}
                {(purchase.differenceFromBudgetToman ?? 0) > 0 ? (
                  <span className="type-caption text-amber-700 dark:text-amber-300">
                    {formatToman(purchase.differenceFromBudgetToman)} بالاتر از بودجه
                  </span>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}

function EmptyInsights() {
  return (
    <Card className="grid min-h-80 place-items-center p-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <ChartNoAxesCombined className="size-7" />
        </span>
        <h2 className="type-section-title mt-4">هنوز خرید ثبت‌شده‌ای برای تحلیل نداری</h2>
        <p className="type-body mt-2 text-muted-foreground">
          وقتی در یک پرونده «نتیجه خرید» را ثبت کنی، هزینه، صرفه‌جویی، سرعت تصمیم و سابقه فروشنده‌ها اینجا ساخته می‌شود.
        </p>
        <Button nativeButton={false} render={<Link href="/" />} className="mt-4">
          رفتن به پرونده‌ها
        </Button>
      </div>
    </Card>
  );
}

function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-48 animate-pulse rounded-3xl border border-border bg-muted/35" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl border border-border bg-muted/30" />
        ))}
      </div>
    </div>
  );
}

function compactAxisValue(value: number) {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1_000_000_000) {
    return `${formatInteger(value / 1_000_000_000)} م‌.`;
  }
  if (Math.abs(value) >= 1_000_000) {
    return `${formatInteger(value / 1_000_000)} م`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${formatInteger(value / 1_000)} ه`;
  }
  return formatInteger(value);
}

const tooltipStyle = {
  direction: "rtl" as const,
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  color: "var(--popover-foreground)",
  fontFamily: "Mikhak",
  fontSize: 12,
};
