"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { Package, Stethoscope } from "lucide-react";
import { createPurchaseCase } from "@/lib/db";
import { purchaseCaseSchema, type PurchaseCaseFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/utils";

export function CreateCaseDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const form = useForm<PurchaseCaseFormValues>({
    resolver: zodResolver(purchaseCaseSchema),
    defaultValues: { title: "", kind: "product", description: "" },
  });

  async function onSubmit(values: PurchaseCaseFormValues) {
    try {
      const row = await createPurchaseCase(values);
      toast("پرونده ساخته شد.");
      onOpenChange(false);
      form.reset();
      router.push(`/cases/${row.id}`);
    } catch {
      toast("ساخت پرونده انجام نشد. دوباره تلاش کن.", "error");
    }
  }

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="پرونده جدید"
      description="برای یک خرید یا خدمت، همه قیمت‌ها را یک‌جا نگه دار."
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5 p-4 pb-6 sm:p-5">
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
