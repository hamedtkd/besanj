"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CopyPlus, ListChecks, Store, WalletCards } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { duplicatePurchaseCase } from "@/lib/db";
import { makeRepeatedCaseTitle } from "@/lib/duplicate-case";
import type { PurchaseCase } from "@/lib/types";

export function DuplicateCaseSheet({
  purchaseCase,
  providerCount,
  open,
  onOpenChange,
}: {
  purchaseCase: PurchaseCase;
  providerCount: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [title, setTitle] = React.useState(() =>
    makeRepeatedCaseTitle(purchaseCase.title)
  );
  const [copyBudget, setCopyBudget] = React.useState(
    Boolean(purchaseCase.targetBudgetToman)
  );
  const [copyRequirements, setCopyRequirements] = React.useState(
    Boolean(purchaseCase.requirements?.length)
  );
  const [copyProviders, setCopyProviders] = React.useState(providerCount > 0);
  const [submitting, setSubmitting] = React.useState(false);

  async function duplicate() {
    if (!title.trim()) {
      toast("برای پرونده جدید یک نام وارد کن.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await duplicatePurchaseCase({
        caseId: purchaseCase.id,
        title,
        copyBudget,
        copyRequirements,
        copyProviders,
      });
      toast("پرونده مشابه ساخته شد؛ قیمت‌ها و پیگیری‌های قبلی کپی نشدند.");
      onOpenChange(false);
      router.push(`/cases/${result.purchaseCase.id}`);
    } catch (error) {
      setSubmitting(false);
      toast(
        error instanceof Error ? error.message : "ساخت پرونده مشابه انجام نشد.",
        "error"
      );
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="ساخت خرید مشابه"
      description="برای خرید تکراری، برنامه خرید و در صورت نیاز فروشنده‌های قبلی را به یک پرونده تازه منتقل کن."
      className="sm:max-w-lg"
    >
      <div className="grid gap-5 p-4 pb-6 sm:p-5">
        <FormField label="نام پرونده جدید" required>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً لپ‌تاپ دفتر - خرید جدید"
          />
        </FormField>

        <div className="grid gap-2">
          <OptionRow
            checked={copyBudget}
            onCheckedChange={setCopyBudget}
            icon={<WalletCards />}
            title="بودجه هدف"
            description={
              purchaseCase.targetBudgetToman
                ? "سقف بودجه این پرونده را هم کپی کن."
                : "در پرونده فعلی بودجه‌ای ثبت نشده است."
            }
            disabled={!purchaseCase.targetBudgetToman}
          />
          <OptionRow
            checked={copyRequirements}
            onCheckedChange={setCopyRequirements}
            icon={<ListChecks />}
            title="شرط‌های خرید"
            description={
              purchaseCase.requirements?.length
                ? `${purchaseCase.requirements.length.toLocaleString("fa-IR-u-nu-arabext")} شرط با شناسه‌های تازه کپی می‌شوند.`
                : "در پرونده فعلی شرطی ثبت نشده است."
            }
            disabled={!purchaseCase.requirements?.length}
          />
          <OptionRow
            checked={copyProviders}
            onCheckedChange={setCopyProviders}
            icon={<Store />}
            title="فروشنده‌های قبلی"
            description={
              providerCount
                ? `${providerCount.toLocaleString("fa-IR-u-nu-arabext")} فروشنده با شماره و امتیاز اعتماد کپی می‌شوند.`
                : "هنوز فروشنده‌ای در این پرونده نیست."
            }
            disabled={!providerCount}
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-2xl border border-border bg-muted/35 p-3.5">
          <div className="type-label">چه چیزهایی کپی نمی‌شوند؟</div>
          <HelpHint label="راهنمای خرید مشابه">
            استعلام‌ها، قیمت‌های قبلی، انتخاب نهایی، پیگیری‌ها و پیوست‌ها عمداً وارد پرونده جدید نمی‌شوند تا خرید تازه تاریخچه مستقل داشته باشد.
          </HelpHint>
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => onOpenChange(false)}
          >
            انصراف
          </Button>
          <Button
            type="button"
            loading={submitting}
            onClick={() => void duplicate()}
          >
            <CopyPlus />
            ساخت پرونده جدید
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}

function OptionRow({
  checked,
  onCheckedChange,
  icon,
  title,
  description,
  disabled = false,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <label
      className={
        disabled
          ? "flex cursor-not-allowed items-start gap-3 rounded-2xl border border-border bg-muted/20 p-3.5 opacity-55"
          : checked
            ? "flex cursor-pointer items-start gap-3 rounded-2xl border border-primary/30 bg-primary/[0.06] p-3.5"
            : "flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background/55 p-3.5"
      }
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(next) => onCheckedChange(next === true)}
        className="mt-0.5"
      />
      <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground [&_svg]:size-4">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="type-label block">{title}</span>
        <span className="type-caption mt-0.5 block text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
