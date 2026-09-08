"use client";

import * as React from "react";
import { BellRing } from "lucide-react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createReminder } from "@/lib/db";
import { dateToIso } from "@/lib/format";
import type { Provider } from "@/lib/types";

function quickDuePresets() {
  const today = new Date();
  const plus = (days: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + days);
    return date;
  };
  return [
    { label: "امروز", value: plus(0) },
    { label: "فردا", value: plus(1) },
    { label: "۳ روز", value: plus(3) },
    { label: "۱ هفته", value: plus(7) },
  ];
}

export function CaseFollowUpSheet({
  caseId,
  providers,
  initialProviderId,
  onOpenChange,
}: {
  caseId: string;
  providers: Provider[];
  initialProviderId?: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = React.useState("پیگیری قیمت");
  const [dueAt, setDueAt] = React.useState<Date | null>(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  });
  const [providerId, setProviderId] = React.useState(initialProviderId ?? "all");
  const [saving, setSaving] = React.useState(false);
  const providerItems = [
    { value: "all", label: "کل پرونده" },
    ...providers.map((provider) => ({ value: provider.id, label: provider.name })),
  ];

  async function save() {
    if (!title.trim()) {
      toast("عنوان پیگیری را وارد کن.", "error");
      return;
    }
    if (!dueAt) {
      toast("تاریخ پیگیری را انتخاب کن.", "error");
      return;
    }

    setSaving(true);
    try {
      await createReminder({
        caseId,
        title,
        dueAt: dateToIso(dueAt, true),
        providerId: providerId === "all" ? undefined : providerId,
      });
      toast("پیگیری ثبت شد.");
      onOpenChange(false);
    } catch (error) {
      toast(error instanceof Error ? error.message : "ثبت پیگیری انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveSheet
      open
      onOpenChange={onOpenChange}
      title="یادآوری پیگیری"
      description="بسنج این مورد را در کارهای امروز و پرونده نگه می‌دارد."
    >
      <div className="grid gap-5 p-4 pb-6 sm:p-5">
        <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/[0.055] p-3.5">
          <BellRing className="mt-0.5 size-4.5 shrink-0 text-primary" />
          <p className="type-caption text-muted-foreground">
            یادآوری‌ها داخل خود بسنج هستند؛ برای هشدار سیستم‌عامل باید بعداً اعلان Push اضافه کنیم.
          </p>
        </div>

        <FormField label="عنوان پیگیری" required>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً تماس دوباره برای قیمت نهایی"
          />
        </FormField>

        <FormField label="برای کدام فروشنده؟">
          <Select<string>
            value={providerId}
            onValueChange={(next) => {
              if (next !== null) setProviderId(next);
            }}
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

        <FormField label="موعد پیگیری" required>
          <DatePicker
            value={dueAt}
            onValueChange={setDueAt}
            min={new Date()}
            drawerTitle="موعد پیگیری"
            quickPresets={quickDuePresets()}
            className="w-full"
          />
        </FormField>

        <div className="sticky bottom-0 -mx-4 -mb-6 mt-1 flex gap-2 border-t border-border bg-popover/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type="button" className="flex-[1.35]" loading={saving} onClick={save}>
            ثبت پیگیری
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
