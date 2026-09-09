"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useRouter } from "next/navigation";
import { ListChecks, Package, Shapes, Stethoscope, Tags, WalletCards } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { createPurchaseCase, markCaseTemplateUsed } from "@/lib/db";
import { mergeRequirements } from "@/lib/planning";
import { BUILTIN_CATEGORIES, CUSTOM_CATEGORY_VALUE, parseTagsText, resolveCategory, tagsToText, isBuiltInCategoryKey } from "@/lib/categories";
import { purchaseCaseSchema, type PurchaseCaseFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
import { PriceInput } from "@/components/ui/price-input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Textarea } from "@/components/ui/textarea";
import { TomanIcon } from "@/components/ui/toman-icon";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";
import type { CaseTemplate } from "@/lib/types";

export function CreateCaseDialog({
  open,
  onOpenChange,
  initialTemplate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTemplate?: CaseTemplate;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<PurchaseCaseFormValues>({
    resolver: zodResolver(purchaseCaseSchema),
    defaultValues: {
      title: "",
      kind: "product",
      description: "",
      targetBudgetToman: null,
      categoryKey: "other",
      customCategory: "",
      tagsText: "",
      requirementsText: "",
    },
  });

  async function onSubmit(values: PurchaseCaseFormValues) {
    try {
      const category = resolveCategory(
        values.categoryKey,
        values.categoryKey === CUSTOM_CATEGORY_VALUE ? values.customCategory : undefined
      );
      const row = await createPurchaseCase({
        title: values.title,
        kind: values.kind,
        description: values.description,
        targetBudgetToman: values.targetBudgetToman,
        categoryKey: category.categoryKey,
        categoryLabel: category.categoryLabel,
        tags: parseTagsText(values.tagsText),
        requirements: mergeRequirements(undefined, values.requirementsText ?? ""),
      });
      if (initialTemplate) await markCaseTemplateUsed(initialTemplate.id);
      toast(initialTemplate ? "پرونده از قالب ساخته شد." : "پرونده ساخته شد.");
      onOpenChange(false);
      form.reset();
      router.push(`/cases/${row.id}`);
    } catch {
      toast("ساخت پرونده انجام نشد. دوباره تلاش کن.", "error");
    }
  }

  React.useEffect(() => {
    if (!open) return;
    if (!initialTemplate) {
      form.reset({
        title: "",
        kind: "product",
        description: "",
        targetBudgetToman: null,
        categoryKey: "other",
        customCategory: "",
        tagsText: "",
        requirementsText: "",
      });
      return;
    }

    let templateCategoryKey: PurchaseCaseFormValues["categoryKey"] = "other";
    let templateCustomCategory = "";
    if (isBuiltInCategoryKey(initialTemplate.categoryKey)) {
      templateCategoryKey = initialTemplate.categoryKey;
    } else if (initialTemplate.categoryKey) {
      templateCategoryKey = CUSTOM_CATEGORY_VALUE;
      templateCustomCategory = initialTemplate.categoryLabel ?? "";
    }

    form.reset({
      title: initialTemplate.name,
      kind: initialTemplate.kind,
      description: initialTemplate.description ?? "",
      targetBudgetToman: initialTemplate.targetBudgetToman ?? null,
      categoryKey: templateCategoryKey,
      customCategory: templateCustomCategory,
      tagsText: tagsToText(initialTemplate.tags),
      requirementsText: initialTemplate.requirementLabels?.join("\n") ?? "",
    });
  }, [form, initialTemplate, open]);

  const selectedCategory = useWatch({
    control: form.control,
    name: "categoryKey",
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="پرونده جدید"
      description="برای یک خرید یا خدمت، قیمت‌ها، شرط‌ها و پیگیری‌ها را یک‌جا نگه دار."
      className="sm:max-w-2xl"
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 p-4 pb-6 sm:p-5">
        {initialTemplate ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/[0.06] px-3.5 py-3">
            <div className="min-w-0">
              <div className="type-label">قالب «{initialTemplate.name}» اعمال شد</div>
              <p className="type-caption mt-0.5 text-muted-foreground">همه چیز قابل ویرایش است؛ فقط عنوان را عوض کن یا مستقیم پرونده را بساز.</p>
            </div>
            <HelpHint label="راهنمای قالب پرونده">
              قالب هیچ فروشنده یا قیمتی را وارد نمی‌کند و فقط اطلاعات پایه برای شروع سریع را آماده کرده است.
            </HelpHint>
          </div>
        ) : null}

        <FormField label="عنوان" required error={form.formState.errors.title?.message}>
          <Input autoFocus placeholder="مثلاً یخچال ساید یا ایمپلنت دندان" {...form.register("title")} />
        </FormField>

        <FormField label="نوع پرونده" required>
          <Controller
            control={form.control}
            name="kind"
            render={({ field }) => (
              <RadioGroup
                value={field.value}
                onValueChange={(value) => field.onChange(value)}
                className="grid grid-cols-2 gap-2"
              >
                <KindOption value="product" active={field.value === "product"} icon={<Package />} label="کالا" />
                <KindOption value="service" active={field.value === "service"} icon={<Stethoscope />} label="خدمت" />
              </RadioGroup>
            )}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="دسته‌بندی"
            required
            error={form.formState.errors.customCategory?.message}
          >
            <Controller
              control={form.control}
              name="categoryKey"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    if (value !== null) field.onChange(value);
                  }}
                  items={[
                    ...BUILTIN_CATEGORIES.map((item) => ({ value: item.key, label: item.label })),
                    { value: CUSTOM_CATEGORY_VALUE, label: "دسته سفارشی" },
                  ]}
                >
                  <SelectTrigger aria-label="دسته‌بندی پرونده">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BUILTIN_CATEGORIES.map((item) => (
                      <SelectItem key={item.key} value={item.key}>
                        {item.label}
                      </SelectItem>
                    ))}
                    <SelectItem value={CUSTOM_CATEGORY_VALUE}>دسته سفارشی</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {selectedCategory === CUSTOM_CATEGORY_VALUE ? (
              <div className="relative mt-2">
                <Shapes className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pe-9"
                  placeholder="مثلاً آموزش یا حیوانات خانگی"
                  {...form.register("customCategory")}
                />
              </div>
            ) : null}
          </FormField>

          <FormField
            label="برچسب‌ها"
            hint="اختیاری؛ با ویرگول جدا کن. حداکثر ۸ برچسب."
            error={form.formState.errors.tagsText?.message}
          >
            <div className="relative">
              <Tags className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pe-9"
                placeholder="ضروری، کاری، هدیه"
                {...form.register("tagsText")}
              />
            </div>
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="بودجه هدف"
            hint="اختیاری؛ بعداً هر قیمت نسبت به این بودجه سنجیده می‌شود."
            error={form.formState.errors.targetBudgetToman?.message}
          >
            <InputGroup className="h-10">
              <Controller
                control={form.control}
                name="targetBudgetToman"
                render={({ field }) => (
                  <PriceInput
                    data-slot="input-group-control"
                    value={field.value ?? null}
                    onValueChange={field.onChange}
                    min={0}
                    className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
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

          <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/[0.06] px-3.5 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <WalletCards className="size-4" />
            </span>
            <span className="type-label">بودجه هدف</span>
            <HelpHint label="راهنمای بودجه هدف">
              بودجه فقط معیار تصمیم است؛ قیمت بالاتر حذف نمی‌شود و همچنان در مقایسه می‌ماند.
            </HelpHint>
          </div>
        </div>

        <FormField
          label="شرط‌ها و مشخصات مهم"
          hint="هر شرط را در یک خط بنویس؛ حداکثر ۱۲ مورد."
          error={form.formState.errors.requirementsText?.message}
        >
          <div className="relative">
            <ListChecks className="pointer-events-none absolute end-3 top-3 size-4 text-muted-foreground" />
            <Textarea
              className="min-h-28 pe-9"
              placeholder={"مثلاً:\nگارانتی رسمی\nتحویل زیر ۳ روز\nرنگ مشکی"}
              {...form.register("requirementsText")}
            />
          </div>
        </FormField>

        <FormField label="توضیح" hint="اختیاری؛ مدل، مشخصات یا محدوده کاری را بنویس." error={form.formState.errors.description?.message}>
          <Textarea placeholder="مثلاً مدل دقیق، رنگ، ظرفیت یا توضیح درمان..." {...form.register("description")} />
        </FormField>

        <div className="sticky bottom-0 -mx-4 -mb-6 mt-1 flex gap-2 border-t border-border bg-popover/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>انصراف</Button>
          <Button type="submit" loading={form.formState.isSubmitting} className="flex-[1.35]">ساخت پرونده</Button>
        </div>
      </form>
    </ResponsiveSheet>
  );
}

function KindOption({
  value,
  active,
  icon,
  label,
}: {
  value: "product" | "service";
  active: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <label
      className={cn(
        "flex h-20 cursor-pointer items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition",
        active
          ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
          : "border-border bg-background/50 text-muted-foreground hover:bg-muted"
      )}
    >
      <RadioGroupItem value={value} className="sr-only" />
      <span className="[&_svg]:size-5">{icon}</span>
      {label}
    </label>
  );
}
