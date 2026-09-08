"use client";

import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  ListChecks,
  Printer,
  Share2,
  Store,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import {
  buildCaseReportSnapshot,
  buildCaseReportText,
} from "@/lib/case-report";
import { db } from "@/lib/db";
import {
  formatInteger,
  formatPersianDate,
  formatToman,
  formatUserText,
} from "@/lib/format";
import { requirementMatchSummary } from "@/lib/planning";

export function CaseReportPage({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const data = useLiveQuery(async () => {
    const [purchaseCase, providers, quotes, reminders, attachments] = await Promise.all([
      db.purchaseCases.get(caseId),
      db.providers.where("caseId").equals(caseId).toArray(),
      db.quotes.where("caseId").equals(caseId).toArray(),
      db.reminders.where("caseId").equals(caseId).toArray(),
      db.attachments.where("caseId").equals(caseId).toArray(),
    ]);
    return { purchaseCase, providers, quotes, reminders, attachments };
  }, [caseId]);

  if (!data) {
    return <ReportSkeleton />;
  }

  if (!data.purchaseCase) {
    return (
      <EmptyState
        title="پرونده پیدا نشد"
        description="گزارشی برای این پرونده در دسترس نیست."
        action={
          <Button nativeButton={false} render={<Link href="/" />}>
            بازگشت به پرونده‌ها
          </Button>
        }
      />
    );
  }

  const snapshot = buildCaseReportSnapshot(
    data.purchaseCase,
    data.providers,
    data.quotes,
    data.reminders,
    data.attachments
  );
  const reportText = buildCaseReportText(snapshot);

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(reportText);
      toast("خلاصه گزارش کپی شد.");
    } catch {
      toast("کپی گزارش انجام نشد.", "error");
    }
  }

  async function shareReport() {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `گزارش بسنج — ${snapshot.purchaseCase.title}`,
          text: reportText,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyReport();
  }

  return (
    <div className="besanj-report-page">
      <div className="no-print mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          nativeButton={false}
          render={<Link href={`/cases/${caseId}`} />}
          variant="ghost"
          className="self-start"
        >
          <ArrowRight />
          بازگشت به پرونده
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => void copyReport()}>
            <ClipboardCopy />
            کپی خلاصه
          </Button>
          <Button type="button" variant="outline" onClick={() => void shareReport()}>
            <Share2 />
            اشتراک
          </Button>
          <Button type="button" onClick={() => window.print()}>
            <Printer />
            چاپ / ذخیره PDF
          </Button>
        </div>
      </div>

      <Card className="print-report overflow-hidden">
        <div className="border-b border-border bg-primary/[0.055] p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="type-caption text-primary">گزارش مقایسه بسنج</div>
              <h1 className="type-page-title mt-1.5">{snapshot.purchaseCase.title}</h1>
              {snapshot.purchaseCase.description ? (
                <p className="type-body mt-2 max-w-3xl text-muted-foreground">
                  {snapshot.purchaseCase.description}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline">
                {snapshot.purchaseCase.kind === "product" ? "کالا" : "خدمت"}
              </Badge>
              <Badge
                variant={
                  snapshot.purchaseCase.status === "decided"
                    ? "success"
                    : snapshot.purchaseCase.status === "archived"
                      ? "outline"
                      : "secondary"
                }
              >
                {snapshot.purchaseCase.status === "active"
                  ? "فعال"
                  : snapshot.purchaseCase.status === "decided"
                    ? "تصمیم‌گرفته"
                    : "آرشیو"}
              </Badge>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ReportMetric label="فروشنده" value={formatInteger(snapshot.providerCount)} />
            <ReportMetric label="کل استعلام" value={formatInteger(snapshot.quoteCount)} />
            <ReportMetric
              label="کمترین قیمت"
              value={snapshot.minTotal === null ? "—" : formatToman(snapshot.minTotal)}
              toman={snapshot.minTotal !== null}
            />
            <ReportMetric
              label="اختلاف قیمت"
              value={snapshot.spread === null ? "—" : formatToman(snapshot.spread)}
              toman={snapshot.spread !== null}
            />
          </div>
        </div>

        <div className="space-y-6 p-5 sm:p-7">
          {snapshot.purchaseCase.targetBudgetToman || snapshot.purchaseCase.requirements?.length ? (
            <section className="report-break-inside grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-muted/25 p-4">
                <div className="type-caption text-muted-foreground">بودجه هدف</div>
                {snapshot.purchaseCase.targetBudgetToman ? (
                  <div className="type-data mt-1.5 inline-flex items-center gap-1 text-xl text-primary">
                    {formatToman(snapshot.purchaseCase.targetBudgetToman)}
                    <TomanIcon className="size-4" />
                  </div>
                ) : (
                  <div className="type-body mt-1.5 text-muted-foreground">ثبت نشده</div>
                )}
              </div>
              <div className="rounded-2xl border border-border bg-muted/25 p-4">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <ListChecks className="size-4" />
                  <span className="type-caption">شرط‌های مهم</span>
                </div>
                {snapshot.purchaseCase.requirements?.length ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {snapshot.purchaseCase.requirements.map((item) => (
                      <Badge key={item.id} variant="outline">{item.label}</Badge>
                    ))}
                  </div>
                ) : (
                  <div className="type-body mt-1.5 text-muted-foreground">ثبت نشده</div>
                )}
              </div>
            </section>
          ) : null}

          {snapshot.selectedRow ? (
            <section className="report-break-inside rounded-2xl border border-primary/30 bg-primary/[0.07] p-4 sm:p-5">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="size-5" />
                <h2 className="type-section-title">انتخاب نهایی</h2>
              </div>
              <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="type-card-title">{snapshot.selectedRow.provider.name}</div>
                  <div className="type-caption mt-1 text-muted-foreground">
                    استعلام {formatPersianDate(snapshot.selectedRow.quote.quotedAt)}
                  </div>
                </div>
                <div className="type-data inline-flex items-center gap-1 text-2xl text-primary">
                  {formatToman(snapshot.selectedRow.totalToman)}
                  <TomanIcon className="size-4" />
                </div>
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Store className="size-5 text-primary" />
              <h2 className="type-section-title">آخرین قیمت فروشنده‌ها</h2>
            </div>

            {snapshot.rows.length ? (
              <div className="grid gap-2">
                {snapshot.rows.map((row, index) => {
                  const requirement = requirementMatchSummary(
                    row.quote,
                    snapshot.purchaseCase.requirements
                  );
                  return (
                    <div
                      key={row.quote.id}
                      className="report-break-inside grid gap-3 rounded-2xl border border-border p-3.5 sm:grid-cols-[2rem_1.4fr_1fr_1fr] sm:items-center"
                    >
                      <div className="type-data grid size-8 place-items-center rounded-xl bg-muted text-sm text-muted-foreground">
                        {(index + 1).toLocaleString("fa-IR")}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="type-label truncate">{row.provider.name}</div>
                          {row.selected ? <Badge variant="success">انتخاب نهایی</Badge> : null}
                        </div>
                        <div className="type-caption mt-0.5 text-muted-foreground">
                          {formatPersianDate(row.quote.quotedAt)}
                          {row.attachmentCount ? ` · ${row.attachmentCount.toLocaleString("fa-IR")} فایل` : ""}
                        </div>
                      </div>
                      <div>
                        <div className="type-caption text-muted-foreground">قیمت نهایی</div>
                        <div className="type-data mt-0.5 inline-flex items-center gap-1 text-lg">
                          {formatToman(row.totalToman)}
                          <TomanIcon className="size-3.5 text-primary" />
                        </div>
                      </div>
                      <div className="type-caption text-muted-foreground">
                        <div>
                          تحویل: {row.quote.deliveryDays === undefined ? "ثبت نشده" : row.quote.deliveryDays === 0 ? "فوری" : `${formatInteger(row.quote.deliveryDays)} روز`}
                        </div>
                        <div className="mt-0.5">گارانتی: {formatUserText(row.quote.warranty)}</div>
                        {requirement.total ? (
                          <div className="mt-0.5">
                            شروط: {requirement.matched.toLocaleString("fa-IR")}/{requirement.total.toLocaleString("fa-IR")}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-muted-foreground">
                <p className="type-body">هنوز استعلامی برای گزارش وجود ندارد.</p>
              </div>
            )}
          </section>

          {snapshot.openReminders.length ? (
            <section className="report-break-inside border-t border-border pt-5">
              <h2 className="type-section-title">پیگیری‌های باز</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {snapshot.openReminders.map((reminder) => (
                  <div key={reminder.id} className="rounded-xl border border-border bg-muted/25 p-3">
                    <div className="type-label">{reminder.title}</div>
                    <div className="type-caption mt-1 text-muted-foreground">
                      موعد: {formatPersianDate(reminder.dueAt)}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <footer className="border-t border-border pt-4 text-center">
            <p className="type-caption text-muted-foreground">
              خروجی بسنج · تاریخ گزارش {formatPersianDate(new Date())}
            </p>
          </footer>
        </div>
      </Card>
    </div>
  );
}

function ReportMetric({
  label,
  value,
  toman = false,
}: {
  label: string;
  value: string;
  toman?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-3">
      <div className="type-caption text-muted-foreground">{label}</div>
      <div className="type-data mt-1 inline-flex items-center gap-1 text-lg">
        {value}
        {toman ? <TomanIcon className="size-3.5 text-primary" /> : null}
      </div>
    </div>
  );
}

function ReportSkeleton() {
  return (
    <div className="space-y-3">
      <div className="h-10 w-56 animate-pulse rounded-xl bg-muted" />
      <div className="h-[34rem] animate-pulse rounded-3xl border border-border bg-card" />
    </div>
  );
}
