"use client";

import * as React from "react";
import { CheckCircle2, PackageCheck, ReceiptText, Trash2, Truck } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { PriceInput } from "@/components/ui/price-input";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TomanIcon } from "@/components/ui/toman-icon";
import { clearPurchaseOutcome, setPurchaseOutcome } from "@/lib/db";
import { dateFromIso, dateToIso, formatToman } from "@/lib/format";
import { quoteTotal } from "@/lib/quote";
import type { Provider, PurchaseCase, PurchaseOutcomeStatus, Quote } from "@/lib/types";

const STATUS_ITEMS: Array<{ value: PurchaseOutcomeStatus; label: string }> = [
  { value: "ordered", label: "سفارش ثبت شده" },
  { value: "received", label: "دریافت شده" },
];

function today() {
  return new Date();
}

export function PurchaseOutcomeSheet({
  purchaseCase,
  quote,
  provider,
  onOpenChange,
}: {
  purchaseCase: PurchaseCase;
  quote: Quote;
  provider: Provider;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const outcome = purchaseCase.purchaseOutcome;
  const [status, setStatus] = React.useState<PurchaseOutcomeStatus>(outcome?.status ?? "ordered");
  const [purchasedAt, setPurchasedAt] = React.useState<Date | null>(
    dateFromIso(outcome?.purchasedAt) ?? today()
  );
  const [actualPaid, setActualPaid] = React.useState<number | null>(
    outcome?.actualPaidToman ?? quoteTotal(quote)
  );
  const [orderReference, setOrderReference] = React.useState(outcome?.orderReference ?? "");
  const [expectedDeliveryAt, setExpectedDeliveryAt] = React.useState<Date | null>(
    dateFromIso(outcome?.expectedDeliveryAt)
  );
  const [receivedAt, setReceivedAt] = React.useState<Date | null>(
    dateFromIso(outcome?.receivedAt)
  );
  const [note, setNote] = React.useState(outcome?.note ?? "");
  const [saving, setSaving] = React.useState(false);
  const [confirmClear, setConfirmClear] = React.useState(false);

  const quotedTotal = quoteTotal(quote);
  const difference = actualPaid === null ? null : actualPaid - quotedTotal;

  async function save() {
    if (!purchasedAt) {
      toast("تاریخ خرید را انتخاب کن.", "error");
      return;
    }
    if (!actualPaid || actualPaid <= 0) {
      toast("مبلغ واقعی خرید را وارد کن.", "error");
      return;
    }

    setSaving(true);
    try {
      await setPurchaseOutcome(purchaseCase.id, {
        quoteId: quote.id,
        status,
        purchasedAt: dateToIso(purchasedAt, true),
        actualPaidToman: actualPaid,
        orderReference,
        expectedDeliveryAt: expectedDeliveryAt
          ? dateToIso(expectedDeliveryAt, true)
          : undefined,
        receivedAt:
          status === "received"
            ? dateToIso(receivedAt ?? purchasedAt, true)
            : undefined,
        note,
      });
      toast(status === "received" ? "نتیجه خرید و دریافت ثبت شد." : "نتیجه خرید ثبت شد.");
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "ثبت نتیجه خرید انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function clearOutcome() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setSaving(true);
    try {
      await clearPurchaseOutcome(purchaseCase.id);
      toast("ثبت خرید پاک شد؛ انتخاب نهایی باقی ماند.");
      onOpenChange(false);
    } catch {
      toast("پاک کردن ثبت خرید انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveSheet
      open
      onOpenChange={onOpenChange}
      title={outcome ? "ویرایش نتیجه خرید" : "ثبت نتیجه خرید"}
      description="قیمت واقعی پرداخت‌شده و وضعیت تحویل را کنار همان تصمیم نگه دار."
      className="sm:max-w-xl"
    >
      <div className="grid gap-5 p-4 pb-6 sm:p-5">
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.055] p-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <ReceiptText className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="type-card-title truncate">{provider.name}</div>
              <div className="type-caption mt-1 text-muted-foreground">قیمت انتخاب‌شده</div>
              <div className="type-data mt-1 inline-flex items-center gap-1 text-xl text-primary">
                {formatToman(quotedTotal)}
                <TomanIcon className="size-4" />
              </div>
            </div>
          </div>
          {difference !== null && difference !== 0 ? (
            <div className="type-caption mt-3 border-t border-primary/10 pt-3 text-muted-foreground">
              مبلغ واقعی {difference > 0 ? "بیشتر از" : "کمتر از"} استعلام است: {formatToman(Math.abs(difference))} تومان
            </div>
          ) : null}
        </div>

        <FormField label="وضعیت خرید" required>
          <Select<PurchaseOutcomeStatus>
            value={status}
            onValueChange={(next) => {
              if (next === null) return;
              setStatus(next);
              if (next === "received" && !receivedAt) setReceivedAt(today());
            }}
            items={STATUS_ITEMS}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="تاریخ خرید" required>
            <DatePicker
              value={purchasedAt}
              onValueChange={setPurchasedAt}
              max={new Date()}
              drawerTitle="تاریخ خرید"
              className="w-full"
            />
          </FormField>

          <FormField label="مبلغ واقعی پرداخت‌شده" required>
            <InputGroup className="h-10">
              <PriceInput
                data-slot="input-group-control"
                value={actualPaid}
                onValueChange={setActualPaid}
                min={1}
                className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>
                  <TomanIcon className="size-4" />
                  <span className="sr-only">تومان</span>
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </FormField>
        </div>

        <FormField label="شماره سفارش / رسید" hint="اختیاری؛ برای پیدا کردن سفارش در آینده.">
          <Input
            value={orderReference}
            onChange={(event) => setOrderReference(event.target.value)}
            placeholder="مثلاً سفارش ۱۲۸۴ یا شماره فاکتور"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="تحویل مورد انتظار" hint="اختیاری">
            <DatePicker
              value={expectedDeliveryAt}
              onValueChange={setExpectedDeliveryAt}
              min={purchasedAt ?? undefined}
              clearable
              drawerTitle="تحویل مورد انتظار"
              className="w-full"
            />
          </FormField>

          {status === "received" ? (
            <FormField label="تاریخ دریافت" required>
              <DatePicker
                value={receivedAt}
                onValueChange={setReceivedAt}
                min={purchasedAt ?? undefined}
                max={new Date()}
                drawerTitle="تاریخ دریافت"
                className="w-full"
              />
            </FormField>
          ) : (
            <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-muted/35 p-3.5">
              <Truck className="size-4.5 shrink-0 text-muted-foreground" />
              <span className="type-label">پیگیری تحویل</span>
              <HelpHint label="راهنمای پیگیری تحویل">
                بعد از رسیدن سفارش، همین بخش را باز کن و وضعیت را «دریافت شده» بگذار.
              </HelpHint>
            </div>
          )}
        </div>

        <FormField label="یادداشت نتیجه" hint="اختیاری؛ تجربه نهایی، تفاوت فاکتور یا نکته تحویل.">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثلاً قیمت نهایی با تخفیف تلفنی کمتر شد."
            className="min-h-24"
          />
        </FormField>

        {outcome ? (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-3.5">
            <div className="flex items-center gap-2.5">
              {outcome.status === "received" ? (
                <PackageCheck className="size-4.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <CheckCircle2 className="size-4.5 shrink-0 text-emerald-700 dark:text-emerald-300" />
              )}
              <span className="type-label">نتیجه خرید قفل‌شده</span>
              <HelpHint label="راهنمای نتیجه خرید">
                ثبت خرید به استعلام انتخاب‌شده قفل است تا نتیجه واقعی با تصمیم اشتباه جابه‌جا نشود.
              </HelpHint>
            </div>
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-4 -mb-6 mt-1 flex flex-wrap gap-2 border-t border-border bg-popover/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5">
          {outcome ? (
            <Button
              type="button"
              variant={confirmClear ? "destructive" : "ghost"}
              loading={saving}
              onClick={clearOutcome}
              className="me-auto"
            >
              <Trash2 />
              {confirmClear ? "دوباره بزن؛ پاک شود" : "پاک کردن ثبت خرید"}
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type="button" loading={saving} onClick={save}>
            {outcome ? "ذخیره تغییرات" : "ثبت خرید"}
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
