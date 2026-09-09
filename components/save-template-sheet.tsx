"use client";

import * as React from "react";
import { BookmarkPlus, ListChecks, WalletCards } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { saveCaseAsTemplate } from "@/lib/db";
import { formatToman } from "@/lib/format";
import { toPersianDigits } from "@/lib/persian-number";
import type { PurchaseCase } from "@/lib/types";

export function SaveTemplateSheet({
  purchaseCase,
  open,
  onOpenChange,
}: {
  purchaseCase: PurchaseCase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [nameDraft, setNameDraft] = React.useState<string | null>(null);
  const [includeBudget, setIncludeBudget] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const name = nameDraft ?? purchaseCase.title;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setNameDraft(null);
      setIncludeBudget(false);
    }
    onOpenChange(nextOpen);
  }

  async function save() {
    if (name.trim().length < 2) {
      toast("برای قالب یک نام کوتاه بنویس.", "error");
      return;
    }
    setSaving(true);
    try {
      await saveCaseAsTemplate(purchaseCase.id, {
        name: name.trim().slice(0, 80),
        includeBudget,
      });
      toast("قالب شخصی ذخیره شد.");
      handleOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "ذخیره قالب انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={handleOpenChange}
      title="ذخیره به‌عنوان قالب"
      description="دسته، برچسب‌ها، شرط‌ها و توضیح این پرونده برای استفاده دوباره ذخیره می‌شوند؛ فروشنده‌ها و قیمت‌ها وارد قالب نمی‌شوند."
      className="sm:max-w-lg"
    >
      <div className="grid gap-4 p-4 pb-6 sm:p-5">
        <label className="grid gap-2">
          <span className="type-label">نام قالب</span>
          <Input value={name} onChange={(event) => setNameDraft(event.currentTarget.value)} autoFocus />
        </label>

        <div className="grid gap-2 rounded-2xl border border-border bg-muted/25 p-3.5">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 type-caption text-muted-foreground">
              <ListChecks className="size-4" />
              شرط‌های ذخیره‌شونده
            </span>
            <span className="type-data">{toPersianDigits(purchaseCase.requirements?.length ?? 0)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="type-caption text-muted-foreground">برچسب‌ها</span>
            <span className="type-data">{toPersianDigits(purchaseCase.tags?.length ?? 0)}</span>
          </div>
        </div>

        {purchaseCase.targetBudgetToman ? (
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border px-3.5 py-3">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="type-label inline-flex items-center gap-1.5">
                  <WalletCards className="size-4" />بودجه را هم نگه دار
                </span>
                <HelpHint label="راهنمای بودجه قالب">
                  بودجه معمولاً با گذشت زمان تغییر می‌کند، برای همین به‌صورت پیش‌فرض داخل قالب ذخیره نمی‌شود.
                </HelpHint>
              </div>
              <p className="type-caption mt-1 text-muted-foreground">{formatToman(purchaseCase.targetBudgetToman)}</p>
            </div>
            <Checkbox checked={includeBudget} onCheckedChange={(value) => setIncludeBudget(Boolean(value))} />
          </label>
        ) : null}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="outline" className="flex-1" onClick={() => handleOpenChange(false)}>
            انصراف
          </Button>
          <Button type="button" className="flex-[1.3]" onClick={save} disabled={saving}>
            <BookmarkPlus />{saving ? "در حال ذخیره..." : "ذخیره قالب"}
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
