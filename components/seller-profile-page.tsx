"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  BadgeCheck,
  CalendarDays,
  CircleDollarSign,
  GitMerge,
  Globe2,
  AtSign,
  MessageCircle,
  Pencil,
  Phone,
  ReceiptText,
  Send,
  ShieldAlert,
  ShoppingBag,
  Star,
  Store,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { HelpHint } from "@/components/help-hint";
import { SellerMergeSheet } from "@/components/seller-merge-sheet";
import { SellerProfileEditSheet } from "@/components/seller-profile-edit-sheet";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { buildProviderContactLinks } from "@/lib/contact";
import { db, setSellerAvoid, setSellerFavorite } from "@/lib/db";
import {
  formatCompactPersianDate,
  formatInteger,
  formatPhone,
  formatPersianDate,
  formatToman,
} from "@/lib/format";
import {
  buildSellerProfileDetails,
  sellerExternalLinks,
} from "@/lib/seller-profiles";
import type { SellerProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SellerProfilePage({ sellerId }: { sellerId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = React.useState(false);
  const [mergeOpen, setMergeOpen] = React.useState(false);
  const data = useLiveQuery(async () => {
    const [profile, sellerProfiles, providers, purchaseCases, quotes] = await Promise.all([
      db.sellerProfiles.get(sellerId),
      db.sellerProfiles.toArray(),
      db.providers.toArray(),
      db.purchaseCases.toArray(),
      db.quotes.toArray(),
    ]);
    return { profile, sellerProfiles, providers, purchaseCases, quotes };
  }, [sellerId]);

  if (!data) return <SellerProfileSkeleton />;
  if (!data.profile) {
    return (
      <EmptyState
        icon={<Store className="size-5" />}
        title="فروشنده پیدا نشد"
        description="ممکن است این پروفایل با فروشنده دیگری ادغام شده باشد یا دیگر وجود نداشته باشد."
        action={
          <Button nativeButton={false} render={<Link href="/sellers" />}>
            بازگشت به فروشنده‌ها
          </Button>
        }
      />
    );
  }

  const profile = data.profile;
  const details = buildSellerProfileDetails(
    profile,
    data.providers,
    data.purchaseCases,
    data.quotes
  );
  const contactLinks = buildProviderContactLinks(profile.phone);
  const externalLinks = sellerExternalLinks(profile);
  const onTimePercent = details.stats.onTimeDeliveryRate === null
    ? null
    : Math.round(details.stats.onTimeDeliveryRate * 100);
  const winPercent = Math.round(details.stats.winRate * 100);

  async function toggleFavorite() {
    try {
      await setSellerFavorite(profile.id, !profile.favorite);
      toast(profile.favorite ? "از فروشنده‌های محبوب خارج شد." : "به فروشنده‌های محبوب اضافه شد.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "تغییر وضعیت انجام نشد.", "error");
    }
  }

  async function toggleAvoid() {
    try {
      await setSellerAvoid(profile.id, !profile.avoid);
      toast(profile.avoid ? "علامت پیشنهاد نمی‌شود برداشته شد." : "این فروشنده با علامت پیشنهاد نمی‌شود ذخیره شد.");
    } catch (error) {
      toast(error instanceof Error ? error.message : "تغییر وضعیت انجام نشد.", "error");
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-3xl border border-border bg-card/75 p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={cn(
                "grid size-12 shrink-0 place-items-center rounded-2xl bg-muted text-muted-foreground",
                profile.favorite && "bg-primary/10 text-primary",
                profile.avoid && "bg-destructive/10 text-destructive"
              )}
            >
              {profile.favorite ? <Star className="size-5 fill-current" /> : profile.avoid ? <ShieldAlert className="size-5" /> : <Store className="size-5" />}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="type-page-title break-words">{profile.name}</h1>
                {profile.favorite ? <Badge variant="success">محبوب</Badge> : null}
                {profile.avoid ? <Badge variant="destructive">پیشنهاد نمی‌شود</Badge> : null}
              </div>
              <p className="type-caption mt-2 text-muted-foreground">
                آخرین تغییر {formatPersianDate(details.stats.lastSeenAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={profile.favorite ? "secondary" : "outline"}
              onClick={() => void toggleFavorite()}
            >
              <Star className={cn(profile.favorite && "fill-current")} />
              {profile.favorite ? "محبوب است" : "محبوب"}
            </Button>
            <Button
              type="button"
              variant={profile.avoid ? "destructive" : "outline"}
              onClick={() => void toggleAvoid()}
            >
              <ShieldAlert />
              {profile.avoid ? "پیشنهاد نمی‌شود" : "علامت هشدار"}
            </Button>
            {data.sellerProfiles.length > 1 ? (
              <Button type="button" variant="outline" onClick={() => setMergeOpen(true)}>
                <GitMerge />
                ادغام
              </Button>
            ) : null}
            <Button type="button" onClick={() => setEditOpen(true)}>
              <Pencil />
              ویرایش
            </Button>
          </div>
        </div>

        <SellerContacts
          profile={profile}
          contactLinks={contactLinks}
          externalLinks={externalLinks}
        />
      </section>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
        <MetricCard label="پرونده" value={formatInteger(details.stats.caseCount)} icon={<Store />} />
        <MetricCard label="استعلام" value={formatInteger(details.stats.quoteCount)} icon={<ReceiptText />} />
        <MetricCard label="خرید" value={formatInteger(details.stats.purchaseCount)} icon={<ShoppingBag />} />
        <MetricCard label="نرخ انتخاب" value={`${winPercent.toLocaleString("fa-IR-u-nu-arabext")}٪`} icon={<BadgeCheck />} />
        <MetricCard
          label="امتیاز میانگین"
          value={details.stats.averageRating === null ? "ثبت نشده" : `${details.stats.averageRating.toLocaleString("fa-IR-u-nu-arabext", { maximumFractionDigits: 1 })} از ۵`}
          icon={<Star />}
        />
        <MetricCard
          label="تحویل به‌موقع"
          value={onTimePercent === null ? "داده ندارد" : `${onTimePercent.toLocaleString("fa-IR-u-nu-arabext")}٪`}
          icon={<CalendarDays />}
        />
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        <MoneyCard label="میانگین قیمت استعلام" value={details.stats.averageQuoteToman} />
        <MoneyCard label="میانگین خرید واقعی" value={details.stats.averagePurchaseToman} />
        <MoneyCard label="جمع خرید از این فروشنده" value={details.stats.totalSpentToman || null} />
      </section>

      {profile.note ? (
        <Card className="p-4 sm:p-5">
          <h2 className="type-section-title">یادداشت فروشنده</h2>
          <p className="type-body mt-2 whitespace-pre-wrap text-muted-foreground">{profile.note}</p>
        </Card>
      ) : null}

      <SellerPurchases rows={details.purchases} />
      <SellerQuoteHistory rows={details.quotes} />
      <SellerRatingHistory rows={details.ratings} />

      {editOpen ? (
        <SellerProfileEditSheet
          key={profile.updatedAt}
          profile={profile}
          onOpenChange={setEditOpen}
        />
      ) : null}

      {mergeOpen ? (
        <SellerMergeSheet
          key={`${profile.id}:${data.sellerProfiles.length}`}
          profile={profile}
          profiles={data.sellerProfiles}
          onOpenChange={setMergeOpen}
          onMerged={(targetId) => {
            setMergeOpen(false);
            router.replace(`/sellers/${targetId}`);
          }}
        />
      ) : null}
    </div>
  );
}

function SellerContacts({
  profile,
  contactLinks,
  externalLinks,
}: {
  profile: SellerProfile;
  contactLinks: ReturnType<typeof buildProviderContactLinks>;
  externalLinks: ReturnType<typeof sellerExternalLinks>;
}) {
  const buttons: Array<{
    label: string;
    href?: string;
    icon: React.ReactNode;
  }> = [
    { label: "تماس", href: contactLinks.callHref, icon: <Phone /> },
    { label: "واتساپ", href: externalLinks.whatsapp ?? contactLinks.whatsappHref, icon: <MessageCircle /> },
    { label: "وب‌سایت", href: externalLinks.website, icon: <Globe2 /> },
    { label: "اینستاگرام", href: externalLinks.instagram, icon: <AtSign /> },
    { label: "تلگرام", href: externalLinks.telegram, icon: <Send /> },
  ].filter((item) => Boolean(item.href));

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="type-caption text-muted-foreground">راه‌های ارتباطی</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {profile.phone ? <Badge variant="outline">{formatPhone(profile.phone)}</Badge> : null}
            {(profile.otherPhones ?? []).map((phone) => (
              <Badge key={phone} variant="outline">{formatPhone(phone)}</Badge>
            ))}
            {profile.instagram ? <Badge variant="secondary">اینستاگرام: {profile.instagram}</Badge> : null}
            {profile.telegram ? <Badge variant="secondary">تلگرام: {profile.telegram}</Badge> : null}
            {profile.website ? <Badge variant="secondary">وب‌سایت ثبت شده</Badge> : null}
            {!profile.phone && !(profile.otherPhones ?? []).length && !profile.instagram && !profile.telegram && !profile.website ? (
              <span className="type-caption text-muted-foreground">اطلاعات تماس تکمیلی ثبت نشده است.</span>
            ) : null}
          </div>
        </div>

        {buttons.length ? (
          <div className="flex flex-wrap gap-2">
            {buttons.map((item) => (
              <Button
                key={item.label}
                nativeButton={false}
                render={
                  <a
                    href={item.href}
                    target={item.href?.startsWith("http") ? "_blank" : undefined}
                    rel={item.href?.startsWith("http") ? "noreferrer" : undefined}
                  />
                }
                variant="outline"
                size="sm"
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="type-caption text-muted-foreground">{label}</span>
        <span className="text-primary [&_svg]:size-4">{icon}</span>
      </div>
      <div className="type-data mt-2 text-lg">{value}</div>
    </Card>
  );
}

function MoneyCard({ label, value }: { label: string; value: number | null }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <CircleDollarSign className="size-4" />
        <span className="type-caption">{label}</span>
      </div>
      <div className="type-data mt-2 inline-flex items-center gap-1.5 text-xl">
        <span>{value === null ? "ثبت نشده" : formatToman(value)}</span>
        {value !== null ? <TomanIcon className="size-4 text-primary" /> : null}
      </div>
    </Card>
  );
}

function SellerPurchases({
  rows,
}: {
  rows: ReturnType<typeof buildSellerProfileDetails>["purchases"];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border p-4 sm:p-5">
        <h2 className="type-section-title">خریدهای ثبت‌شده</h2>
        <HelpHint label="راهنمای خریدهای فروشنده">
          همه خریدهایی که انتخاب نهایی‌شان به این فروشنده رسیده است.
        </HelpHint>
      </div>
      {rows.length ? (
        <div className="divide-y divide-border/70">
          {rows.map((row) => (
            <div key={row.purchaseCase.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
              <div className="min-w-0">
                <Link href={`/cases/${row.purchaseCase.id}`} className="type-label hover:text-primary">
                  {row.purchaseCase.title}
                </Link>
                <p className="type-caption mt-1 text-muted-foreground">
                  خرید {formatPersianDate(row.purchasedAt)} · قیمت استعلام {formatToman(row.quote.priceToman)}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <Badge variant="success">
                  <span>{formatToman(row.actualPaidToman)}</span>
                  <TomanIcon className="size-3" />
                </Badge>
                {row.deliveredOnTime === true ? <Badge variant="success">تحویل به‌موقع</Badge> : null}
                {row.deliveredOnTime === false ? <Badge variant="warning">تحویل دیرتر</Badge> : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="type-body p-4 text-muted-foreground sm:p-5">هنوز خریدی از این فروشنده ثبت نشده است.</p>
      )}
    </Card>
  );
}

function SellerQuoteHistory({
  rows,
}: {
  rows: ReturnType<typeof buildSellerProfileDetails>["quotes"];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border p-4 sm:p-5">
        <h2 className="type-section-title">همه استعلام‌ها</h2>
        <HelpHint label="راهنمای استعلام‌های فروشنده">
          قیمت‌های این فروشنده در تمام پرونده‌ها، از جدیدترین به قدیمی‌ترین.
        </HelpHint>
      </div>
      {rows.length ? (
        <div className="divide-y divide-border/70">
          {rows.map((row) => (
            <div key={row.quote.id} className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {row.purchaseCase ? (
                    <Link href={`/cases/${row.purchaseCase.id}`} className="type-label hover:text-primary">
                      {row.purchaseCase.title}
                    </Link>
                  ) : (
                    <span className="type-label">پرونده حذف‌شده</span>
                  )}
                  {row.purchased ? <Badge variant="success">خرید شده</Badge> : row.selected ? <Badge variant="secondary">انتخاب نهایی</Badge> : null}
                </div>
                <p className="type-caption mt-1 text-muted-foreground">
                  {formatCompactPersianDate(row.quote.quotedAt)} · {row.quote.deliveryDays === undefined ? "زمان تحویل ثبت نشده" : row.quote.deliveryDays === 0 ? "تحویل فوری" : `${row.quote.deliveryDays.toLocaleString("fa-IR-u-nu-arabext")} روز تا تحویل`}
                </p>
              </div>
              <div className="type-data inline-flex items-center gap-1.5 text-lg sm:justify-end">
                <span>{formatToman(row.quote.priceToman + (row.quote.extraCostToman ?? 0))}</span>
                <TomanIcon className="size-3.5 text-primary" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="type-body p-4 text-muted-foreground sm:p-5">استعلامی برای این فروشنده ثبت نشده است.</p>
      )}
    </Card>
  );
}

function SellerRatingHistory({
  rows,
}: {
  rows: ReturnType<typeof buildSellerProfileDetails>["ratings"];
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border p-4 sm:p-5">
        <h2 className="type-section-title">سابقه امتیاز</h2>
        <HelpHint label="راهنمای سابقه امتیاز">
          امتیازهایی که در پرونده‌های مختلف برای این فروشنده ثبت شده‌اند.
        </HelpHint>
      </div>
      {rows.length ? (
        <div className="divide-y divide-border/70">
          {rows.map((row) => (
            <div key={row.provider.id} className="grid gap-2 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
              <div className="min-w-0">
                {row.purchaseCase ? (
                  <Link href={`/cases/${row.purchaseCase.id}`} className="type-label hover:text-primary">
                    {row.purchaseCase.title}
                  </Link>
                ) : (
                  <span className="type-label">پرونده حذف‌شده</span>
                )}
                <p className="type-caption mt-1 text-muted-foreground">
                  {formatPersianDate(row.provider.ratingUpdatedAt ?? row.provider.updatedAt)}
                  {row.provider.ratingNote ? ` · ${row.provider.ratingNote}` : ""}
                </p>
              </div>
              <Badge variant={(row.provider.rating ?? 0) >= 4 ? "success" : "outline"}>
                <Star className="fill-current text-amber-500" />
                {(row.provider.rating ?? 0).toLocaleString("fa-IR-u-nu-arabext")} از ۵
              </Badge>
            </div>
          ))}
        </div>
      ) : (
        <p className="type-body p-4 text-muted-foreground sm:p-5">هنوز امتیازی برای این فروشنده ثبت نشده است.</p>
      )}
    </Card>
  );
}

function SellerProfileSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-44 rounded-3xl bg-muted" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-72 rounded-3xl bg-muted" />
    </div>
  );
}
