"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Textarea } from "@/components/ui/textarea";
import { updateProviderRating } from "@/lib/db";
import type { Provider } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProviderRatingSheet({
  provider,
  onOpenChange,
}: {
  provider: Provider;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [rating, setRating] = React.useState(provider.rating ?? 0);
  const [note, setNote] = React.useState(provider.ratingNote ?? "");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      await updateProviderRating(provider.id, rating || undefined, note);
      toast("امتیاز فروشنده ذخیره شد.");
      onOpenChange(false);
    } catch {
      toast("ذخیره امتیاز انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ResponsiveSheet
      open
      onOpenChange={onOpenChange}
      title={`امتیاز ${provider.name}`}
      description="این امتیاز فقط تجربه شخصی توست و در تصمیم‌یار به‌عنوان یک نشانه اعتماد استفاده می‌شود."
    >
      <div className="grid gap-5 p-4 pb-6 sm:p-5">
        <FormField label="امتیاز اعتماد">
          <div className="flex flex-wrap gap-1.5" dir="ltr">
            {Array.from({ length: 5 }, (_, index) => index + 1).map((value) => (
              <Button
                key={value}
                type="button"
                variant={value <= rating ? "secondary" : "outline"}
                size="icon"
                aria-label={`${value.toLocaleString("fa-IR")} از ۵`}
                title={`${value.toLocaleString("fa-IR")} از ۵`}
                onClick={() => setRating(rating === value ? 0 : value)}
                className={cn(value <= rating && "border-amber-500/25 text-amber-600 dark:text-amber-300")}
              >
                <Star className={cn(value <= rating && "fill-current")} />
              </Button>
            ))}
          </div>
        </FormField>

        <FormField
          label="یادداشت اعتماد"
          hint="مثلاً خوش‌قول، پاسخ‌گو، سابقه خرید خوب یا برعکس."
        >
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="چیزی که دفعه بعد برای انتخاب این فروشنده به دردت می‌خورد..."
          />
        </FormField>

        <div className="sticky bottom-0 -mx-4 -mb-6 mt-1 flex gap-2 border-t border-border bg-popover/95 px-4 py-4 backdrop-blur sm:-mx-5 sm:px-5">
          <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type="button" className="flex-[1.35]" loading={saving} onClick={save}>
            ذخیره امتیاز
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
