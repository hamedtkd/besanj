"use client";

import * as React from "react";
import { Save } from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { useToast } from "@/components/toast";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import { Textarea } from "@/components/ui/textarea";
import { updateSellerProfile } from "@/lib/db";
import type { SellerProfile } from "@/lib/types";

function splitPhones(value: string) {
  return value
    .split(/[،,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
}

export function SellerProfileEditSheet({
  profile,
  onOpenChange,
}: {
  profile: SellerProfile;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const [name, setName] = React.useState(profile.name);
  const [phone, setPhone] = React.useState(profile.phone ?? "");
  const [otherPhones, setOtherPhones] = React.useState(
    (profile.otherPhones ?? []).join("، ")
  );
  const [website, setWebsite] = React.useState(profile.website ?? "");
  const [instagram, setInstagram] = React.useState(profile.instagram ?? "");
  const [telegram, setTelegram] = React.useState(profile.telegram ?? "");
  const [whatsapp, setWhatsapp] = React.useState(profile.whatsapp ?? "");
  const [note, setNote] = React.useState(profile.note ?? "");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!name.trim()) {
      toast("نام فروشنده را وارد کن.", "error");
      return;
    }

    setSaving(true);
    try {
      await updateSellerProfile(profile.id, {
        name,
        phone,
        otherPhones: splitPhones(otherPhones),
        website,
        instagram,
        telegram,
        whatsapp,
        note,
        favorite: profile.favorite,
        avoid: profile.avoid,
      });
      toast("پروفایل فروشنده در همه پرونده‌های مرتبط به‌روزرسانی شد.");
      onOpenChange(false);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "ذخیره فروشنده انجام نشد.",
        "error"
      );
      setSaving(false);
    }
  }

  return (
    <ResponsiveSheet
      open
      onOpenChange={onOpenChange}
      title="ویرایش فروشنده"
      description="نام و شماره اصلی به‌صورت سراسری در پرونده‌های مرتبط به‌روزرسانی می‌شود."
    >
      <div className="space-y-4 p-4 sm:p-5">
        <Field>
          <FieldLabel>نام فروشنده</FieldLabel>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="مثلاً فروشگاه آریا"
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>شماره اصلی</FieldLabel>
            <Input
              dir="ltr"
              inputMode="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="0912..."
            />
          </Field>
          <Field>
            <div className="flex items-center gap-1.5">
              <FieldLabel>شماره‌های دیگر</FieldLabel>
              <HelpHint label="راهنمای شماره‌های دیگر">
                حداکثر ۸ شماره، با ویرگول از هم جدا شوند.
              </HelpHint>
            </div>
            <Input
              dir="ltr"
              value={otherPhones}
              onChange={(event) => setOtherPhones(event.target.value)}
              placeholder="با ویرگول جدا کن"
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel>وب‌سایت</FieldLabel>
            <Input
              dir="ltr"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
              placeholder="example.com"
            />
          </Field>
          <Field>
            <FieldLabel>اینستاگرام</FieldLabel>
            <Input
              dir="ltr"
              value={instagram}
              onChange={(event) => setInstagram(event.target.value)}
              placeholder="username یا لینک"
            />
          </Field>
          <Field>
            <FieldLabel>تلگرام</FieldLabel>
            <Input
              dir="ltr"
              value={telegram}
              onChange={(event) => setTelegram(event.target.value)}
              placeholder="username یا لینک"
            />
          </Field>
          <Field>
            <FieldLabel>واتساپ</FieldLabel>
            <Input
              dir="ltr"
              value={whatsapp}
              onChange={(event) => setWhatsapp(event.target.value)}
              placeholder="شماره، شناسه یا لینک"
            />
          </Field>
        </div>

        <Field>
          <FieldLabel>یادداشت فروشنده</FieldLabel>
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="مثلاً پاسخ‌گویی خوب، شرایط خاص پرداخت یا نکته‌ای برای خرید بعدی"
            rows={5}
          />
        </Field>

        <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            انصراف
          </Button>
          <Button type="button" loading={saving} onClick={() => void save()}>
            <Save />
            ذخیره تغییرات
          </Button>
        </div>
      </div>
    </ResponsiveSheet>
  );
}
