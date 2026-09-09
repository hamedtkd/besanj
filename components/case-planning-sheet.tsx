"use client";

import * as React from "react";
import { ListChecks, Shapes, Tags, WalletCards } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupText,
} from "@/components/ui/input-group";
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
import {
  BUILTIN_CATEGORIES,
  CUSTOM_CATEGORY_VALUE,
  NO_CATEGORY_KEY,
  parseTagsText,
  resolveCategory,
  tagsToText,
} from "@/lib/categories";
import { updatePurchaseCase } from "@/lib/db";
import { mergeRequirements, requirementsToText } from "@/lib/planning";
import type { PurchaseCase } from "@/lib/types";

export function CasePlanningSheet({
  purchaseCase,
  onOpenChange,
}: {
  purchaseCase: PurchaseCase;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [budget, setBudget] = React.useState<number | null>(
    purchaseCase.targetBudgetToman ?? null
  );
  const initialCategory = purchaseCase.categoryKey?.startsWith("custom:")
    ? CUSTOM_CATEGORY_VALUE
    : purchaseCase.categoryKey ?? NO_CATEGORY_KEY;
  const [categoryKey, setCategoryKey] = React.useState(initialCategory);
  const [customCategory, setCustomCategory] = React.useState(
    purchaseCase.categoryKey?.startsWith("custom:") ? purchaseCase.categoryLabel ?? "" : ""
  );
  const [tagsText, setTagsText] = React.useState(tagsToText(purchaseCase.tags));
  const [requirementsText, setRequirementsText] = React.useState(
    requirementsToText(purchaseCase.requirements)
  );
  const [saving, setSaving] = React.useState(false);

  async function save() {
    const category = resolveCategory(
      categoryKey,
      categoryKey === CUSTOM_CATEGORY_VALUE ? customCategory : undefined
    );
    if (categoryKey === CUSTOM_CATEGORY_VALUE && customCategory.trim().length < 2) {
      toast("نام دسته سفارشی را کامل وارد کن.", "error");
      return;
    }

    setSaving(true);
    try {
      await updatePurchaseCase(purchaseCase.id, {
        targetBudgetToman: budget ?? undefined,
        categoryKey: category.categoryKey,
        categoryLabel: category.categoryLabel,
        tags: parseTagsText(tagsText),
        requirements: mergeRequirements(
          purchaseCase.requirements,
          requirementsText
        ),
      });
      toast("برنامه و دسته‌بندی خرید ذخیره شد.");
      onOpenChange(false);
    } catch {
      toast("ذخیره برنامه خرید انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveSheet
      open
      onOpenChange={onOpenChange}
      title="برنامه و دسته‌بندی خرید"
      description="دسته، برچسب، بودجه و معیارهایی را ثبت کن که برای این تصمیم مهم‌اند."
      className="sm:max-w-xl"
    >
      <div className="grid gap-5 p-4 pb-6 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="دسته‌بندی">
            <Select
              value={categoryKey}
              onValueChange={(value) => {
                if (value !== null) setCategoryKey(value);
              }}
              items={[
                { value: NO_CATEGORY_KEY, label: "بدون دسته" },
                ...BUILTIN_CATEGORIES.map((item) => ({ value: item.key, label: item.label })),
                { value: CUSTOM_CATEGORY_VALUE, label: "دسته سفارشی" },
              ]}
            >
              <SelectTrigger aria-label="دسته‌بندی پرونده">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_CATEGORY_KEY}>بدون دسته</SelectItem>
                {BUILTIN_CATEGORIES.map((item) => (
                  <SelectItem key={item.key} value={item.key}>
                    {item.label}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_CATEGORY_VALUE}>دسته سفارشی</SelectItem>
              </SelectContent>
            </Select>
            {categoryKey === CUSTOM_CATEGORY_VALUE ? (
              <div className="relative mt-2">
                <Shapes className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pe-9"
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                  placeholder="نام دسته سفارشی"
                />
              </div>
            ) : null}
          </FormField>

          <FormField label="برچسب‌ها" hint="با ویرگول جدا کن. حداکثر ۸ برچسب.">
            <div className="relative">
              <Tags className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pe-9"
                value={tagsText}
                onChange={(event) => setTagsText(event.target.value)}
                placeholder="ضروری، کاری، تعمیر"
              />
            </div>
          </FormField>
        </div>

        <FormField
          label="بودجه هدف"
          hint="اختیاری؛ قیمت‌ها نسبت به این سقف برچسب می‌خورند و تصمیم‌یار هم از آن استفاده می‌کند."
        >
          <InputGroup className="h-10">
            <PriceInput
              data-slot="input-group-control"
              value={budget}
              onValueChange={setBudget}
              min={0}
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

        <div className="rounded-2xl border border-primary/15 bg-primary/[0.055] p-3.5">
          <div className="flex items-center gap-2.5">
            <WalletCards className="size-4.5 shrink-0 text-primary" />
            <span className="type-label">بودجه هدف پرونده</span>
            <HelpHint label="راهنمای بودجه هدف پرونده">
              بودجه هدف این پرونده با بودجه ماهانه فرق دارد. این عدد برای انتخاب همین خرید است و بودجه ماهانه برای کنترل مجموع خریدها استفاده می‌شود.
            </HelpHint>
          </div>
        </div>

        <FormField
          label="شرط‌ها و مشخصات مهم"
          hint="هر مورد را در یک خط بنویس. هنگام ثبت هر استعلام مشخص می‌کنی فروشنده کدام شرط‌ها را پوشش می‌دهد."
        >
          <div className="relative">
            <ListChecks className="pointer-events-none absolute end-3 top-3 size-4 text-muted-foreground" />
            <Textarea
              value={requirementsText}
              onChange={(event) => setRequirementsText(event.target.value)}
              className="min-h-40 pe-9"
              placeholder={"گارانتی رسمی\nتحویل زیر ۳ روز\nرنگ مشکی"}
            />
          </div>
        </FormField>

        <div className="sticky bottom-0 -mx-4 -mb-6 mt-1 flex gap-2 border-t border-border bg-popover/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button type="button" className="flex-[1.35]" loading={saving} onClick={save}>
            ذخیره تغییرات
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
