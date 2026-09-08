"use client";

import * as React from "react";
import { ListChecks, WalletCards } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { TomanIcon } from "@/components/ui/toman-icon";
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
  const [requirementsText, setRequirementsText] = React.useState(
    requirementsToText(purchaseCase.requirements)
  );
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      await updatePurchaseCase(purchaseCase.id, {
        targetBudgetToman: budget ?? undefined,
        requirements: mergeRequirements(
          purchaseCase.requirements,
          requirementsText
        ),
      });
      toast("بودجه و شرط‌های خرید ذخیره شد.");
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
      title="بودجه و شرط‌های خرید"
      description="معیارهایی را ثبت کن که موقع مقایسه فروشنده‌ها واقعاً مهم‌اند."
      className="sm:max-w-xl"
    >
      <div className="grid gap-5 p-4 pb-6 sm:p-5">
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
          <div className="flex items-start gap-2.5">
            <WalletCards className="mt-0.5 size-4.5 shrink-0 text-primary" />
            <p className="type-caption text-muted-foreground">
              بودجه «قیمت بالاتر» را مخفی نمی‌کند؛ فقط کمک می‌کند سریع بفهمی کدام گزینه داخل سقف توست.
            </p>
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
