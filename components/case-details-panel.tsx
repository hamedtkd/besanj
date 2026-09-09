"use client";

import * as React from "react";
import Link from "next/link";
import {
  Archive,
  BellRing,
  Check,
  CheckCircle2,
  CopyPlus,
  Download,
  FileText,
  ListChecks,
  Pencil,
  RotateCcw,
  Shapes,
  Star,
  Tags,
  Trash2,
  WalletCards,
} from "lucide-react";
import { CaseFollowUpSheet } from "@/components/case-follow-up-sheet";
import { HelpHint } from "@/components/help-hint";
import { DuplicateCaseSheet } from "@/components/duplicate-case-sheet";
import { CasePlanningSheet } from "@/components/case-planning-sheet";
import { ProviderRatingSheet } from "@/components/provider-rating-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TomanIcon } from "@/components/ui/toman-icon";
import { useToast } from "@/components/toast";
import { formatFileSize } from "@/lib/attachments";
import {
  deleteAttachment,
  deleteReminder,
  selectQuote,
  setPurchaseStatus,
  setReminderDone,
} from "@/lib/db";
import { formatPersianDate, formatToman, kindLabel } from "@/lib/format";
import { categoryLabelForCase } from "@/lib/categories";
import { quoteTotal } from "@/lib/quote";
import type {
  CaseReminder,
  Provider,
  PurchaseCase,
  Quote,
  QuoteAttachment,
} from "@/lib/types";

export function CaseDetailsPanel({
  purchaseCase,
  quotes,
  providers,
  reminders,
  attachments,
}: {
  purchaseCase: PurchaseCase;
  quotes: Quote[];
  providers: Provider[];
  reminders: CaseReminder[];
  attachments: QuoteAttachment[];
}) {
  const { toast } = useToast();
  const [planningOpen, setPlanningOpen] = React.useState(false);
  const [followUpOpen, setFollowUpOpen] = React.useState(false);
  const [duplicateOpen, setDuplicateOpen] = React.useState(false);
  const [ratingProvider, setRatingProvider] = React.useState<Provider | null>(null);
  const selected = quotes.find((quote) => quote.id === purchaseCase.selectedQuoteId);
  const selectedProvider = selected
    ? providers.find((provider) => provider.id === selected.providerId)
    : undefined;
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const quoteById = new Map(quotes.map((quote) => [quote.id, quote]));
  const openReminders = reminders
    .filter((reminder) => reminder.status === "open")
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());
  const doneReminders = reminders.filter((reminder) => reminder.status === "done");

  async function toggleArchive() {
    if (purchaseCase.status === "archived") {
      await setPurchaseStatus(
        purchaseCase.id,
        purchaseCase.selectedQuoteId ? "decided" : "active"
      );
      toast("پرونده به لیست برگردانده شد.");
    } else {
      await setPurchaseStatus(purchaseCase.id, "archived");
      toast("پرونده آرشیو شد.");
    }
  }

  async function clearSelection() {
    await selectQuote(purchaseCase.id, undefined);
    toast("انتخاب نهایی پاک شد.");
  }

  async function completeReminder(id: string) {
    await setReminderDone(id, true);
    toast("پیگیری انجام‌شده علامت خورد.");
  }

  async function removeReminder(id: string) {
    await deleteReminder(id);
    toast("پیگیری حذف شد.");
  }

  function openAttachment(attachment: QuoteAttachment) {
    const url = URL.createObjectURL(attachment.blob);
    const previewable =
      attachment.mimeType.startsWith("image/") || attachment.mimeType === "application/pdf";
    if (previewable) {
      window.open(url, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      return;
    }

    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = attachment.fileName;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  async function removeAttachment(id: string) {
    await deleteAttachment(id);
    toast("پیوست حذف شد.");
  }

  return (
    <>
      <div className="grid gap-3 lg:grid-cols-[1.2fr_.8fr]">
        <Card className="p-4 sm:p-5">
          <h3 className="type-section-title">اطلاعات پرونده</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Row label="نوع">{kindLabel(purchaseCase.kind)}</Row>
            <Row label="دسته‌بندی">
              <span className="inline-flex items-center gap-1.5">
                <Shapes className="size-3.5 text-muted-foreground" />
                {categoryLabelForCase(purchaseCase)}
              </span>
            </Row>
            <Row label="وضعیت">
              <Badge
                variant={
                  purchaseCase.status === "decided"
                    ? "success"
                    : purchaseCase.status === "archived"
                      ? "outline"
                      : "secondary"
                }
              >
                {purchaseCase.status === "active"
                  ? "فعال"
                  : purchaseCase.status === "decided"
                    ? "تصمیم‌گرفته"
                    : "آرشیو"}
              </Badge>
            </Row>
            <Row label="ساخته‌شده">{formatPersianDate(purchaseCase.createdAt)}</Row>
            <Row label="آخرین تغییر">{formatPersianDate(purchaseCase.updatedAt)}</Row>
          </div>

          {purchaseCase.description ? (
            <div className="mt-4 rounded-2xl bg-muted/50 p-3.5">
              <div className="type-caption text-muted-foreground">توضیحات</div>
              <p className="type-body mt-1 whitespace-pre-wrap">{purchaseCase.description}</p>
            </div>
          ) : null}

          {purchaseCase.tags?.length ? (
            <div className="mt-4 rounded-2xl bg-muted/50 p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Tags className="size-4" />
                <span className="type-caption">برچسب‌ها</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {purchaseCase.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setDuplicateOpen(true)}>
              <CopyPlus />
              خرید مشابه
            </Button>
            <Button type="button" variant="outline" onClick={toggleArchive}>
              {purchaseCase.status === "archived" ? <RotateCcw /> : <Archive />}
              {purchaseCase.status === "archived" ? "بازگرداندن پرونده" : "آرشیو پرونده"}
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-primary" />
            <h3 className="type-section-title">تصمیم نهایی</h3>
          </div>

          {selected && selectedProvider ? (
            <div className="mt-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4">
                <div className="type-caption text-muted-foreground">انتخاب فعلی</div>
                <div className="mt-1 font-medium">{selectedProvider.name}</div>
                <div className="type-data mt-2 inline-flex items-center gap-1 text-xl text-primary">
                  {formatToman(quoteTotal(selected))}
                  <TomanIcon className="size-4" />
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="mt-2 w-full"
                onClick={clearSelection}
              >
                لغو انتخاب نهایی
              </Button>
            </div>
          ) : (
            <p className="type-body mt-4 text-muted-foreground">
              هنوز گزینه‌ای را نهایی نکرده‌ای. از تب مقایسه یکی از استعلام‌ها را انتخاب کن.
            </p>
          )}
        </Card>

        <Card className="p-4 sm:p-5 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <WalletCards className="size-5 text-primary" />
              <h3 className="type-section-title">برنامه خرید</h3>
              <HelpHint label="راهنمای برنامه خرید">
                دسته، برچسب، بودجه و شرط‌هایی که باید موقع تصمیم نهایی جلوی چشم بمانند.
              </HelpHint>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setPlanningOpen(true)}>
              <Pencil />ویرایش
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[.7fr_1.3fr]">
            <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
              <div className="type-caption text-muted-foreground">بودجه هدف</div>
              {purchaseCase.targetBudgetToman ? (
                <div className="type-data mt-1.5 inline-flex items-center gap-1 text-lg text-primary">
                  {formatToman(purchaseCase.targetBudgetToman)}
                  <TomanIcon className="size-4" />
                </div>
              ) : (
                <div className="type-body mt-1.5 text-muted-foreground">ثبت نشده</div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-3.5">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <ListChecks className="size-4" />
                <span className="type-caption">شرط‌های مهم</span>
              </div>
              {purchaseCase.requirements?.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {purchaseCase.requirements.map((requirement) => (
                    <Badge key={requirement.id} variant="outline">{requirement.label}</Badge>
                  ))}
                </div>
              ) : (
                <div className="type-body mt-1.5 text-muted-foreground">هنوز شرطی ثبت نشده است.</div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BellRing className="size-5 text-primary" />
                <h3 className="type-section-title">پیگیری‌ها</h3>
              </div>
              <p className="type-caption mt-1 text-muted-foreground">
                {openReminders.length.toLocaleString("fa-IR-u-nu-arabext")} مورد باز · {doneReminders.length.toLocaleString("fa-IR-u-nu-arabext")} انجام‌شده
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => setFollowUpOpen(true)}>
              افزودن
            </Button>
          </div>

          {openReminders.length ? (
            <div className="mt-4 grid gap-2">
              {openReminders.map((reminder) => {
                const provider = reminder.providerId ? providerById.get(reminder.providerId) : undefined;
                return (
                  <div key={reminder.id} className="flex items-start gap-2 rounded-xl border border-border bg-background/55 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="type-label truncate">{reminder.title}</div>
                      <div className="type-caption mt-0.5 text-muted-foreground">
                        {formatPersianDate(reminder.dueAt)}
                        {provider ? ` · ${provider.name}` : " · کل پرونده"}
                      </div>
                    </div>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="انجام شد" onClick={() => void completeReminder(reminder.id)}>
                      <Check />
                    </Button>
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="حذف پیگیری" onClick={() => void removeReminder(reminder.id)}>
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border px-3 py-4 text-center text-muted-foreground">
              <span className="type-caption">پیگیری بازی نداری.</span>
            </div>
          )}
        </Card>

        <Card className="p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <Star className="size-5 text-primary" />
            <h3 className="type-section-title">اعتماد به فروشنده‌ها</h3>
            <HelpHint label="راهنمای امتیاز فروشنده">
              تجربه خودت را ثبت کن؛ امتیاز اعتماد در تصمیم‌یار اثر ملایم دارد.
            </HelpHint>
          </div>

          {providers.length ? (
            <div className="mt-4 grid gap-2">
              {providers.map((provider) => (
                <div key={provider.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/55 p-3">
                  <div className="min-w-0 flex-1">
                    <div className="type-label truncate">
                      {provider.sellerProfileId ? (
                        <Link href={`/sellers/${provider.sellerProfileId}`} className="hover:text-primary">
                          {provider.name}
                        </Link>
                      ) : (
                        provider.name
                      )}
                    </div>
                    <div className="type-caption mt-0.5 truncate text-muted-foreground">
                      {provider.rating
                        ? `امتیاز ${provider.rating.toLocaleString("fa-IR-u-nu-arabext")} از ۵${provider.ratingNote ? ` · ${provider.ratingNote}` : ""}`
                        : "هنوز امتیازی ثبت نشده"}
                    </div>
                  </div>
                  {provider.rating ? (
                    <Badge variant="outline">
                      <Star className="fill-current text-amber-500" />
                      {provider.rating.toLocaleString("fa-IR-u-nu-arabext")}/۵
                    </Badge>
                  ) : null}
                  <Button type="button" size="sm" variant="ghost" onClick={() => setRatingProvider(provider)}>
                    {provider.rating ? "ویرایش" : "امتیاز"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="type-body mt-4 text-muted-foreground">بعد از ثبت اولین استعلام، فروشنده اینجا ظاهر می‌شود.</p>
          )}
        </Card>

        <Card className="p-4 sm:p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <FileText className="size-5 text-primary" />
            <h3 className="type-section-title">پیوست‌های استعلام</h3>
            <HelpHint label="راهنمای پیوست‌ها">
              فایل‌ها فقط روی همین مرورگر و داخل دیتابیس محلی بسنج ذخیره می‌شوند.
            </HelpHint>
            {attachments.length ? <Badge variant="secondary">{attachments.length.toLocaleString("fa-IR-u-nu-arabext")}</Badge> : null}
          </div>

          {attachments.length ? (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {attachments
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((attachment) => {
                  const quote = quoteById.get(attachment.quoteId);
                  const provider = quote ? providerById.get(quote.providerId) : undefined;
                  return (
                    <div key={attachment.id} className="flex items-center gap-3 rounded-xl border border-border bg-background/55 p-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <FileText className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="type-label truncate" title={attachment.fileName}>{attachment.fileName}</div>
                        <div className="type-caption mt-0.5 truncate text-muted-foreground">
                          {formatFileSize(attachment.size)}
                          {provider ? ` · ${provider.name}` : ""}
                          {quote ? ` · ${formatPersianDate(quote.quotedAt)}` : ""}
                        </div>
                      </div>
                      <Button type="button" size="icon-sm" variant="ghost" aria-label="باز کردن فایل" onClick={() => openAttachment(attachment)}>
                        <Download />
                      </Button>
                      <Button type="button" size="icon-sm" variant="ghost" aria-label="حذف فایل" onClick={() => void removeAttachment(attachment.id)}>
                        <Trash2 />
                      </Button>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border px-3 py-5 text-center text-muted-foreground">
              <span className="type-caption">هنوز فایلی به استعلام‌ها وصل نشده است.</span>
            </div>
          )}
        </Card>
      </div>

      {duplicateOpen ? (
        <DuplicateCaseSheet
          purchaseCase={purchaseCase}
          providerCount={providers.length}
          open={duplicateOpen}
          onOpenChange={setDuplicateOpen}
        />
      ) : null}

      {planningOpen ? (
        <CasePlanningSheet purchaseCase={purchaseCase} onOpenChange={setPlanningOpen} />
      ) : null}

      {followUpOpen ? (
        <CaseFollowUpSheet
          caseId={purchaseCase.id}
          providers={providers}
          onOpenChange={setFollowUpOpen}
        />
      ) : null}

      {ratingProvider ? (
        <ProviderRatingSheet
          key={ratingProvider.id}
          provider={ratingProvider}
          onOpenChange={(open) => {
            if (!open) setRatingProvider(null);
          }}
        />
      ) : null}
    </>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl bg-muted/50 px-3 py-2.5">
      <div className="type-caption text-muted-foreground">{label}</div>
      <div className="type-body mt-1">{children}</div>
    </div>
  );
}
