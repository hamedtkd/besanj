"use client";

import * as React from "react";
import { Plus, Trash2, WalletCards } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
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
import { TomanIcon } from "@/components/ui/toman-icon";
import { collectCategoryOptions } from "@/lib/categories";
import { saveBudgetPlan } from "@/lib/db";
import type { BudgetPlan, PurchaseCase } from "@/lib/types";

interface CategoryLimitRow {
  key: string;
  limit: number | null;
}

export function BudgetSettingsSheet({
  open,
  onOpenChange,
  cases,
  plan,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cases: PurchaseCase[];
  plan?: BudgetPlan | null;
}) {
  const categoryOptions = React.useMemo(() => collectCategoryOptions(cases), [cases]);

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="بودجه ماهانه"
      description="برای کل ماه و دسته‌های مهم سقف تعیین کن. مصرف از مبلغ واقعی خریدهای ثبت‌شده محاسبه می‌شود."
      className="sm:max-w-xl"
    >
      {open ? (
        <BudgetSettingsForm
          key={plan?.updatedAt ?? "new"}
          categoryOptions={categoryOptions}
          plan={plan}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </ResponsiveSheet>
  );
}

function BudgetSettingsForm({
  categoryOptions,
  plan,
  onClose,
}: {
  categoryOptions: ReturnType<typeof collectCategoryOptions>;
  plan?: BudgetPlan | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const labels = React.useMemo(
    () => new Map(categoryOptions.map((item) => [item.key, item.label])),
    [categoryOptions]
  );
  const [monthlyLimit, setMonthlyLimit] = React.useState<number | null>(
    plan?.monthlyLimitToman ?? null
  );
  const [rows, setRows] = React.useState<CategoryLimitRow[]>(() =>
    Object.entries(plan?.categoryLimits ?? {}).map(([key, limit]) => ({ key, limit }))
  );
  const [newCategoryKey, setNewCategoryKey] = React.useState<string>(
    categoryOptions[0]?.key ?? "other"
  );
  const [saving, setSaving] = React.useState(false);

  const usedKeys = new Set(rows.map((row) => row.key));
  const availableCategories = categoryOptions.filter((item) => !usedKeys.has(item.key));

  function addCategory() {
    const key = availableCategories.some((item) => item.key === newCategoryKey)
      ? newCategoryKey
      : availableCategories[0]?.key;
    if (!key) return;
    setRows((current) => [...current, { key, limit: null }]);
    const next = availableCategories.find((item) => item.key !== key);
    if (next) setNewCategoryKey(next.key);
  }

  async function save() {
    setSaving(true);
    try {
      const categoryLimits = Object.fromEntries(
        rows
          .filter((row) => row.limit !== null && Number.isFinite(row.limit) && (row.limit ?? 0) > 0)
          .map((row) => [row.key, Math.round(row.limit ?? 0)])
      );
      await saveBudgetPlan({
        monthlyLimitToman: monthlyLimit,
        categoryLimits,
      });
      toast("بودجه ماهانه ذخیره شد.");
      onClose();
    } catch {
      toast("ذخیره بودجه انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 p-4 pb-6 sm:p-5">
      <FormField
        label="سقف کل ماه"
        hint="اگر خالی بگذاری فقط بودجه دسته‌ها بررسی می‌شود."
      >
        <InputGroup className="h-10">
          <PriceInput
            data-slot="input-group-control"
            value={monthlyLimit}
            onValueChange={setMonthlyLimit}
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
          <span className="type-label">بودجه ماهانه</span>
          <HelpHint label="راهنمای بودجه ماهانه">
            این بودجه هر ماه دوباره از صفر سنجیده می‌شود. اطلاعات ماه‌های قبلی پاک نمی‌شوند و فقط میزان مصرف ماه جاری جدا محاسبه می‌شود.
          </HelpHint>
        </div>
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h3 className="type-card-title">سقف دسته‌ها</h3>
            <HelpHint label="راهنمای سقف دسته‌ها">
              برای دسته‌هایی که خرجشان مهم‌تر است سقف جدا بگذار.
            </HelpHint>
          </div>
        </div>

        <div className="grid gap-2">
          {rows.map((row, index) => (
            <div key={row.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-2xl border border-border bg-muted/25 p-2.5 sm:grid-cols-[minmax(0,1fr)_minmax(9rem,13rem)_auto]">
              <span className="col-start-1 row-start-1 type-label truncate px-1">{labels.get(row.key) ?? row.key}</span>
              <InputGroup className="col-span-2 row-start-2 h-9 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                <PriceInput
                  data-slot="input-group-control"
                  value={row.limit}
                  onValueChange={(value) => {
                    setRows((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, limit: value } : item
                      )
                    );
                  }}
                  min={0}
                  className="flex-1 rounded-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>
                    <TomanIcon className="size-3.5" />
                    <span className="sr-only">تومان</span>
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="col-start-2 row-start-1 sm:col-start-3"
                aria-label={`حذف سقف ${labels.get(row.key) ?? "دسته"}`}
                onClick={() => setRows((current) => current.filter((_, itemIndex) => itemIndex !== index))}
              >
                <Trash2 />
              </Button>
            </div>
          ))}
        </div>

        {availableCategories.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <Select<string>
              value={availableCategories.some((item) => item.key === newCategoryKey) ? newCategoryKey : availableCategories[0]?.key}
              onValueChange={(value) => { if (value !== null) setNewCategoryKey(value); }}
              items={availableCategories.map((item) => ({ value: item.key, label: item.label }))}
            >
              <SelectTrigger aria-label="انتخاب دسته برای بودجه">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.map((item) => (
                  <SelectItem key={item.key} value={item.key}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={addCategory}>
              <Plus />
              افزودن سقف دسته
            </Button>
          </div>
        ) : null}
      </section>

      <div className="sticky bottom-0 -mx-4 -mb-6 mt-1 flex gap-2 border-t border-border bg-popover/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          انصراف
        </Button>
        <Button type="button" className="flex-[1.35]" loading={saving} onClick={() => void save()}>
          ذخیره بودجه
        </Button>
      </div>
    </div>
  );
}
