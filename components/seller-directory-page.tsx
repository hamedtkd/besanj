"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ChevronLeft,
  Search,
  ShieldAlert,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { HelpHint } from "@/components/help-hint";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TomanIcon } from "@/components/ui/toman-icon";
import { db } from "@/lib/db";
import { formatInteger, formatPhone, formatToman } from "@/lib/format";
import { buildSellerDirectory, sellerMatchesSearch } from "@/lib/seller-profiles";
import { cn } from "@/lib/utils";

type SellerFilter = "all" | "favorite" | "avoid";

export function SellerDirectoryPage() {
  const [search, setSearch] = React.useState("");
  const [filter, setFilter] = React.useState<SellerFilter>("all");
  const data = useLiveQuery(async () => {
    const [sellerProfiles, providers, purchaseCases, quotes] = await Promise.all([
      db.sellerProfiles.toArray(),
      db.providers.toArray(),
      db.purchaseCases.toArray(),
      db.quotes.toArray(),
    ]);
    return { sellerProfiles, providers, purchaseCases, quotes };
  }, []);

  if (!data) return <SellerDirectorySkeleton />;

  const rows = buildSellerDirectory(
    data.sellerProfiles,
    data.providers,
    data.purchaseCases,
    data.quotes
  );
  const favoriteCount = rows.filter((row) => row.profile.favorite).length;
  const avoidCount = rows.filter((row) => row.profile.avoid).length;
  const purchasedCount = rows.filter((row) => row.stats.purchaseCount > 0).length;
  const visibleRows = rows.filter((row) => {
    if (!sellerMatchesSearch(row.profile, search)) return false;
    if (filter === "favorite" && !row.profile.favorite) return false;
    if (filter === "avoid" && !row.profile.avoid) return false;
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Store className="size-5" />
            <span className="type-label">حافظه فروشنده‌ها</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <h1 className="type-page-title">فروشنده‌ها</h1>
            <HelpHint label="راهنمای فروشنده‌ها" side="bottom">
              سابقه قیمت، خرید، امتیاز و تحویل هر فروشنده در همه پرونده‌ها اینجا کنار هم می‌ماند.
            </HelpHint>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <SummaryCard label="کل فروشنده‌ها" value={rows.length} icon={<Store />} />
        <SummaryCard label="فروشنده محبوب" value={favoriteCount} icon={<Star />} />
        <SummaryCard label="دارای خرید" value={purchasedCount} icon={<ShoppingBag />} />
        <SummaryCard label="پیشنهاد نمی‌شود" value={avoidCount} icon={<ShieldAlert />} warning />
      </section>

      {rows.length ? (
        <>
          <section className="rounded-2xl border border-border bg-card/70 p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative min-w-0 flex-1 sm:max-w-md">
                <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="جست‌وجوی نام، شماره یا راه ارتباطی"
                  className="ps-9"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
                  همه
                </FilterButton>
                <FilterButton active={filter === "favorite"} onClick={() => setFilter("favorite")}>
                  <Star /> محبوب
                </FilterButton>
                <FilterButton active={filter === "avoid"} onClick={() => setFilter("avoid")}>
                  <ShieldAlert /> پیشنهاد نمی‌شود
                </FilterButton>
              </div>
            </div>
          </section>

          {visibleRows.length ? (
            <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleRows.map(({ profile, stats }) => {
                const onTimeRate = stats.onTimeDeliveryRate === null
                  ? null
                  : Math.round(stats.onTimeDeliveryRate * 100);
                return (
                  <Link key={profile.id} href={`/sellers/${profile.id}`} className="group block h-full">
                    <Card
                      className={cn(
                        "flex h-full min-h-64 flex-col p-4 transition-[border-color,box-shadow,transform] group-hover:-translate-y-0.5 group-hover:border-primary/35 group-hover:shadow-lg sm:p-5",
                        profile.favorite && "border-primary/30 bg-primary/[0.025]",
                        profile.avoid && "border-destructive/25 bg-destructive/[0.025]"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <span
                            className={cn(
                              "grid size-10 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground",
                              profile.favorite && "bg-primary/10 text-primary",
                              profile.avoid && "bg-destructive/10 text-destructive"
                            )}
                          >
                            {profile.favorite ? <Star className="size-4.5 fill-current" /> : profile.avoid ? <ShieldAlert className="size-4.5" /> : <Store className="size-4.5" />}
                          </span>
                          <div className="min-w-0">
                            <h2 className="type-card-title truncate">{profile.name}</h2>
                            <p className="type-caption mt-1 truncate text-muted-foreground">
                              {profile.phone ? formatPhone(profile.phone) : "شماره اصلی ثبت نشده"}
                            </p>
                          </div>
                        </div>
                        <ChevronLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {profile.favorite ? <Badge variant="success">محبوب</Badge> : null}
                        {profile.avoid ? <Badge variant="destructive">پیشنهاد نمی‌شود</Badge> : null}
                        {stats.averageRating !== null ? (
                          <Badge variant="outline">
                            <Star className="fill-current text-amber-500" />
                            {stats.averageRating.toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 1 })} از ۵
                          </Badge>
                        ) : null}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2">
                        <MiniMetric label="پرونده" value={formatInteger(stats.caseCount)} />
                        <MiniMetric label="استعلام" value={formatInteger(stats.quoteCount)} />
                        <MiniMetric label="خرید" value={formatInteger(stats.purchaseCount)} />
                      </div>

                      <div className="mt-auto pt-4">
                        <div className="flex items-center justify-between gap-3 border-t border-border/80 pt-3">
                          <div className="min-w-0">
                            <div className="type-caption text-muted-foreground">جمع خرید</div>
                            <div className="type-data mt-1 inline-flex items-center gap-1">
                              <span className="truncate">{stats.totalSpentToman ? formatToman(stats.totalSpentToman) : "ثبت نشده"}</span>
                              {stats.totalSpentToman ? <TomanIcon className="size-3.5 text-primary" /> : null}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="type-caption text-muted-foreground">تحویل به‌موقع</div>
                            <div className="type-label mt-1">
                              {onTimeRate === null ? "داده ندارد" : `${onTimeRate.toLocaleString("fa-IR-u-nu-arabext")}٪`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </section>
          ) : (
            <EmptyState
              icon={<Search className="size-5" />}
              title="فروشنده‌ای با این فیلتر پیدا نشد"
              description="عبارت جست‌وجو یا فیلتر را تغییر بده تا فروشنده‌ها دوباره نمایش داده شوند."
              action={
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                  }}
                >
                  پاک کردن فیلتر
                </Button>
              }
            />
          )}
        </>
      ) : (
        <EmptyState
          icon={<Store className="size-5" />}
          title="هنوز فروشنده‌ای در حافظه بسنج نیست"
          description="با ثبت اولین استعلام، پروفایل فروشنده ساخته می‌شود و سابقه آن در پرونده‌های بعدی هم قابل استفاده است."
          action={
            <Button nativeButton={false} render={<Link href="/" />}>
              رفتن به پرونده‌ها
            </Button>
          }
        />
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  warning = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  warning?: boolean;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="type-caption text-muted-foreground">{label}</div>
        <span className={cn("text-primary [&_svg]:size-4", warning && "text-destructive")}>{icon}</span>
      </div>
      <div className="type-data mt-2 text-xl">{value.toLocaleString("fa-IR-u-nu-arabext")}</div>
    </Card>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-muted/25 px-2.5 py-2.5 text-center">
      <div className="type-caption text-muted-foreground">{label}</div>
      <div className="type-data mt-1">{value}</div>
    </div>
  );
}

function SellerDirectorySkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-10 w-48 rounded-xl bg-muted" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-16 rounded-2xl bg-muted" />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-64 rounded-2xl bg-muted" />
        ))}
      </div>
    </div>
  );
}
