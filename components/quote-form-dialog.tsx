"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { DoranDate } from "@doranjs/core";
import { Calculator, CirclePlus, ListChecks, Paperclip, X } from "lucide-react";
import { QuoteCapturePanel } from "@/components/quote-capture-panel";
import { addQuote } from "@/lib/db";
import { formatFileSize, validateAttachmentSelection } from "@/lib/attachments";
import {
  channelContactMeta,
  dateToIso,
  formatPersianDate,
  QUOTE_CHANNELS,
} from "@/lib/format";
import { quoteTotal } from "@/lib/quote";
import { buildProviderSuggestions } from "@/lib/provider-history";
import type { QuoteCaptureDraft } from "@/lib/quote-capture";
import { quoteFormSchema, type QuoteFormValues } from "@/lib/schemas";
import type { CaseRequirement, Provider, Quote, QuoteChannel } from "@/lib/types";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import { IntegerInput } from "@/components/ui/integer-input";
import { MobileNumberInput } from "@/components/ui/mobile-number-input";
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
import { normalizeOptionalText } from "@/lib/validation-rules";

export type RequotePreset = {
  quote: Quote;
  provider: Provider;
};

function cleanText(value?: string | null) {
  return normalizeOptionalText(value) ?? "";
}

function blankValues(preset?: RequotePreset | null): QuoteFormValues {
  return {
    providerName: cleanText(preset?.provider.name),
    phone: cleanText(preset?.provider.phone),
    priceToman: 0,
    extraCostToman: null,
    quotedAt: new Date(),
    validUntil: null,
    deliveryDays:
      typeof preset?.quote.deliveryDays === "number" &&
      Number.isFinite(preset.quote.deliveryDays)
        ? preset.quote.deliveryDays
        : null,
    warranty: cleanText(preset?.quote.warranty),
    paymentTerms: cleanText(preset?.quote.paymentTerms),
    channel: preset?.quote.channel ?? "phone",
    contactRef: cleanText(preset?.quote.contactRef),
    note: "",
  };
}

function validityPresets(quotedAt: Date) {
  const base = DoranDate.fromGregorian(quotedAt);
  return [
    { label: "همان روز", value: base.toGregorian() },
    { label: "۳ روز", value: base.addDays(3).toGregorian() },
    { label: "۱ هفته", value: base.addDays(7).toGregorian() },
    { label: "۲ هفته", value: base.addDays(14).toGregorian() },
    { label: "۱ ماه", value: base.addMonths(1).toGregorian() },
  ] as const;
}

export function QuoteFormDialog({
  caseId,
  open,
  onOpenChange,
  preset,
  requirements = [],
  providers = [],
  allProviders = [],
}: {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: RequotePreset | null;
  requirements?: CaseRequirement[];
  providers?: Provider[];
  allProviders?: Provider[];
}) {
  const { toast } = useToast();
  const [requirementChecks, setRequirementChecks] = React.useState<Record<string, boolean>>(() => ({ ...(preset?.quote.requirementChecks ?? {}) }));
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([]);
  const [providerChoice, setProviderChoice] = React.useState("__new__");

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteFormSchema),
    defaultValues: blankValues(preset),
  });

  React.useEffect(() => {
    if (open) form.reset(blankValues(preset));
  }, [open, preset, form]);

  const price = useWatch({ control: form.control, name: "priceToman" }) || 0;
  const extra = useWatch({ control: form.control, name: "extraCostToman" }) || 0;
  const quotedAt = useWatch({ control: form.control, name: "quotedAt" });
  const channel = useWatch({ control: form.control, name: "channel" });
  const total = quoteTotal({ priceToman: price, extraCostToman: extra });
  const contactMeta = channelContactMeta(channel);
  const quickValidityPresets = React.useMemo(
    () => validityPresets(quotedAt),
    [quotedAt]
  );
  const providerSuggestions = React.useMemo(
    () => buildProviderSuggestions(caseId, allProviders.length ? allProviders : providers),
    [allProviders, caseId, providers]
  );
  const providerItems = React.useMemo(
    () => [
      { value: "__new__", label: "فروشنده جدید" },
      ...providerSuggestions.map((suggestion) => ({
        value: suggestion.value,
        label:
          suggestion.scope === "current"
            ? suggestion.provider.name
            : `${suggestion.provider.name} · از سابقه`,
      })),
    ],
    [providerSuggestions]
  );

  function chooseProvider(next: string | null) {
    if (!next) return;
    setProviderChoice(next);
    if (next === "__new__") {
      form.setValue("providerName", "", { shouldValidate: true });
      form.setValue("phone", "");
      return;
    }

    const suggestion = providerSuggestions.find((item) => item.value === next);
    if (!suggestion) return;
    form.setValue("providerName", suggestion.provider.name, { shouldValidate: true });
    form.setValue("phone", suggestion.provider.phone ?? "");
  }

  function applyCapturedQuote(draft: QuoteCaptureDraft, sourceText: string) {
    if (draft.providerName) {
      form.setValue("providerName", draft.providerName, { shouldValidate: true });
      setProviderChoice("__new__");
    }
    if (draft.phone) form.setValue("phone", draft.phone, { shouldValidate: true });
    if (draft.priceToman) {
      form.setValue("priceToman", draft.priceToman, { shouldValidate: true });
    }
    if (draft.extraCostToman !== undefined) {
      form.setValue("extraCostToman", draft.extraCostToman, { shouldValidate: true });
    }
    if (draft.deliveryDays !== undefined) {
      form.setValue("deliveryDays", draft.deliveryDays, { shouldValidate: true });
    }
    if (draft.warranty) form.setValue("warranty", draft.warranty);
    if (draft.paymentTerms) form.setValue("paymentTerms", draft.paymentTerms);
    if (draft.channel) form.setValue("channel", draft.channel);
    if (draft.contactRef) form.setValue("contactRef", draft.contactRef);
    if (draft.validForDays !== undefined) {
      form.setValue(
        "validUntil",
        DoranDate.fromGregorian(quotedAt).addDays(draft.validForDays).toGregorian(),
        { shouldValidate: true }
      );
    }
    if (sourceText && !form.getValues("note")) {
      const preserved = sourceText.length > 940 ? `${sourceText.slice(0, 937)}...` : sourceText;
      form.setValue("note", `متن مبنا:\n${preserved}`);
    }

    toast(
      draft.detectedFields.length
        ? `${draft.detectedFields.length.toLocaleString("fa-IR")} بخش از متن در فرم قرار گرفت.`
        : "اطلاعات مشخصی از متن پیدا نشد؛ فرم را دستی کامل کن."
    );
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      setPendingFiles([]);
      setRequirementChecks({});
      setProviderChoice("__new__");
    }
    onOpenChange(next);
  }

  function handleFilesChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    const error = validateAttachmentSelection(files);
    if (error) {
      toast(error, "error");
      event.currentTarget.value = "";
      return;
    }
    setPendingFiles(files);
  }

  async function onSubmit(
    values: QuoteFormValues,
    event?: React.BaseSyntheticEvent
  ) {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as
      | HTMLButtonElement
      | null
      | undefined;
    const submitMode = submitter?.value === "next" ? "next" : "close";

    try {
      await addQuote({
        caseId,
        providerName: values.providerName,
        phone: values.phone,
        priceToman: values.priceToman,
        extraCostToman: values.extraCostToman,
        quotedAt: dateToIso(values.quotedAt),
        validUntil: values.validUntil ? dateToIso(values.validUntil, true) : undefined,
        deliveryDays: values.deliveryDays,
        warranty: values.warranty,
        paymentTerms: values.paymentTerms,
        channel: values.channel,
        contactRef: values.contactRef,
        note: values.note,
        requirementChecks,
        previousQuoteId: preset?.quote.id,
        attachments: pendingFiles.map((file) => ({
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
          blob: file,
        })),
      });

      toast(preset ? "قیمت جدید ثبت شد." : "استعلام ثبت شد.");

      if (!preset && submitMode === "next") {
        form.reset(blankValues());
        setPendingFiles([]);
        setRequirementChecks({});
      } else {
        handleOpenChange(false);
      }
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "ثبت استعلام انجام نشد.",
        "error"
      );
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={preset ? `استعلام مجدد از ${preset.provider.name}` : "ثبت استعلام"}
      description={
        preset
          ? "قیمت قبلی حذف نمی‌شود و تغییر قیمت در تاریخچه همان فروشنده می‌ماند."
          : "قیمت و شرایطی که همین حالا گرفته‌ای را ثبت کن."
      }
      className="sm:max-w-2xl"
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid gap-5 p-4 pb-6 sm:p-5"
      >
        {!preset ? <QuoteCapturePanel onApply={applyCapturedQuote} /> : null}

        {!preset && providerSuggestions.length ? (
          <FormField
            label="انتخاب سریع فروشنده قبلی"
            hint="فروشنده‌های همین پرونده و سابقه خریدهای قبلی را بدون تایپ دوباره استفاده کن."
          >
            <Select<string>
              value={providerChoice}
              onValueChange={chooseProvider}
              items={providerItems}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providerItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="فروشنده / ارائه‌دهنده"
            required
            error={form.formState.errors.providerName?.message}
          >
            <Input
              placeholder="مثلاً فروشگاه مرکزی"
              readOnly={Boolean(preset)}
              {...form.register("providerName")}
            />
          </FormField>

          <FormField label="شماره موبایل" error={form.formState.errors.phone?.message}>
            <Controller
              control={form.control}
              name="phone"
              render={({ field }) => (
                <MobileNumberInput
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  readOnly={Boolean(preset)}
                  aria-invalid={Boolean(form.formState.errors.phone)}
                />
              )}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="قیمت"
            required
            error={form.formState.errors.priceToman?.message}
          >
            <InputGroup className="h-10">
              <Controller
                control={form.control}
                name="priceToman"
                render={({ field }) => (
                  <PriceInput
                    data-slot="input-group-control"
                    value={field.value > 0 ? field.value : null}
                    onValueChange={(value) => field.onChange(value ?? 0)}
                    min={0}
                    aria-invalid={Boolean(form.formState.errors.priceToman)}
                    className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent"
                  />
                )}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>
                  <TomanIcon className="size-4" />
                  <span className="sr-only">تومان</span>
                </InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          </FormField>

          <FormField
            label="هزینه اضافه"
            hint="ارسال، نصب، ویزیت یا هزینه جانبی"
            error={form.formState.errors.extraCostToman?.message}
          >
            <InputGroup className="h-10">
              <Controller
                control={form.control}
                name="extraCostToman"
                render={({ field }) => (
                  <PriceInput
                    data-slot="input-group-control"
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                    min={0}
                    aria-invalid={Boolean(form.formState.errors.extraCostToman)}
                    className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent"
                  />
                )}
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

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/10 px-3.5 py-3">
          <div>
            <div className="type-caption text-muted-foreground">قیمت نهایی</div>
            <div className="type-data mt-0.5 inline-flex items-center gap-1 text-lg text-primary">
              {total.toLocaleString("fa-IR")}
              <TomanIcon className="size-4" />
            </div>
          </div>
          <Calculator className="size-5 text-primary/70" />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="تاریخ استعلام"
            required
            error={form.formState.errors.quotedAt?.message}
          >
            <Controller
              control={form.control}
              name="quotedAt"
              render={({ field }) => (
                <DatePicker
                  value={field.value}
                  onValueChange={(value) => value && field.onChange(value)}
                  placeholder="تاریخ استعلام"
                  drawerTitle="تاریخ استعلام"
                  className="w-full"
                />
              )}
            />
          </FormField>

          <FormField
            label="اعتبار قیمت تا"
            hint="اگر فروشنده زمانی برای اعتبار قیمت گفته است"
            error={form.formState.errors.validUntil?.message}
          >
            <Controller
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <DatePicker
                  value={field.value ?? null}
                  onValueChange={field.onChange}
                  placeholder="انتخاب تاریخ اعتبار"
                  drawerTitle="اعتبار قیمت تا"
                  clearable
                  className="w-full"
                  min={quotedAt}
                  quickPresets={quickValidityPresets}
                />
              )}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="زمان تحویل"
            hint="تعداد روز؛ صفر یعنی تحویل فوری"
            error={form.formState.errors.deliveryDays?.message}
          >
            <Controller
              control={form.control}
              name="deliveryDays"
              render={({ field }) => (
                <IntegerInput
                  value={field.value ?? null}
                  onValueChange={field.onChange}
                  min={0}
                  placeholder="مثلاً ۳"
                  aria-invalid={Boolean(form.formState.errors.deliveryDays)}
                />
              )}
            />
          </FormField>

          <FormField label="روش استعلام" error={form.formState.errors.channel?.message}>
            <Controller
              control={form.control}
              name="channel"
              render={({ field }) => (
                <Select<QuoteChannel>
                  value={field.value}
                  onValueChange={(value) => { if (value !== null) field.onChange(value); }}
                  items={QUOTE_CHANNELS}
                >
                  <SelectTrigger className="h-10 rounded-xl">
                    <SelectValue placeholder="روش استعلام" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUOTE_CHANNELS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label={contactMeta.label}
            hint="اختیاری؛ برای اینکه دفعه بعد سریع همان مسیر را پیدا کنی"
            error={form.formState.errors.contactRef?.message}
          >
            <Input
              dir="auto"
              placeholder={contactMeta.placeholder}
              {...form.register("contactRef")}
            />
          </FormField>

          <FormField label="گارانتی" error={form.formState.errors.warranty?.message}>
            <Input
              placeholder="مثلاً ۱۸ ماه گارانتی شرکتی"
              {...form.register("warranty")}
            />
          </FormField>
        </div>

        <FormField
          label="شرایط پرداخت"
          error={form.formState.errors.paymentTerms?.message}
        >
          <Input
            placeholder="نقد، کارت، اقساط، بیعانه..."
            {...form.register("paymentTerms")}
          />
        </FormField>

        {requirements.length ? (
          <FormField
            label="پوشش شرط‌های خرید"
            hint="تیک بزن این فروشنده کدام شرط‌های مهم پرونده را پوشش می‌دهد."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {requirements.map((requirement) => {
                const checked = requirementChecks[requirement.id] === true;
                return (
                  <label
                    key={requirement.id}
                    className={
                      checked
                        ? "flex cursor-pointer items-start gap-2.5 rounded-xl border border-primary/30 bg-primary/[0.06] p-3"
                        : "flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-background/50 p-3"
                    }
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(next) =>
                        setRequirementChecks((current) => ({
                          ...current,
                          [requirement.id]: next === true,
                        }))
                      }
                      className="mt-0.5"
                    />
                    <span className="type-label min-w-0 flex-1">{requirement.label}</span>
                  </label>
                );
              })}
            </div>
          </FormField>
        ) : null}

        <FormField
          label="پیوست‌ها"
          hint="عکس، پیش‌فاکتور یا فایل مربوط به همین استعلام؛ حداکثر ۵ فایل و هر فایل ۸ مگابایت."
        >
          <div className="grid gap-2">
            <Input
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFilesChange}
              className="h-auto min-h-10 py-1.5 file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-2.5 file:py-1 file:text-xs file:font-medium file:text-primary"
            />
            {pendingFiles.length ? (
              <div className="grid gap-1.5">
                {pendingFiles.map((file, index) => (
                  <div key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-2 rounded-xl border border-border bg-muted/30 px-3 py-2">
                    <Paperclip className="size-4 shrink-0 text-primary" />
                    <span className="type-caption min-w-0 flex-1 truncate">{file.name}</span>
                    <span className="type-caption shrink-0 text-muted-foreground">{formatFileSize(file.size)}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`حذف ${file.name}`}
                      onClick={() => setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-muted-foreground">
                <ListChecks className="size-4" />
                <span className="type-caption">پیوستی انتخاب نشده است.</span>
              </div>
            )}
          </div>
        </FormField>

        <FormField label="یادداشت" error={form.formState.errors.note?.message}>
          <Textarea
            placeholder="هر چیزی که بعداً ممکن است یادت برود..."
            {...form.register("note")}
          />
        </FormField>

        {preset ? (
          <div className="rounded-2xl bg-muted/50 px-3.5 py-3">
            <p className="type-caption text-muted-foreground">
              قیمت قبلی در <span className="font-medium text-foreground">{formatPersianDate(preset.quote.quotedAt)}</span>{" "}
              ثبت شده و بعد از ذخیره، هر دو نسخه در تاریخچه همان فروشنده دیده می‌شوند.
            </p>
          </div>
        ) : null}

        <div className="sticky bottom-0 -mx-4 -mb-6 mt-1 grid grid-cols-2 gap-2 border-t border-border bg-popover/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5">
          {!preset ? (
            <Button
              type="submit"
              name="submitMode"
              value="next"
              variant="outline"
              disabled={form.formState.isSubmitting}
            >
              <CirclePlus />
              ثبت و بعدی
            </Button>
          ) : (
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              انصراف
            </Button>
          )}
          <Button
            type="submit"
            name="submitMode"
            value="close"
            loading={form.formState.isSubmitting}
          >
            {preset ? "ثبت قیمت جدید" : "ثبت استعلام"}
          </Button>
        </div>
      </form>
    </ResponsiveSheet>
  );
}
