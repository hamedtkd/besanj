"use client";

import * as React from "react";
import { GitMerge, TriangleAlert } from "lucide-react";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ResponsiveSheet } from "@/components/ui/responsive-sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mergeSellerProfiles } from "@/lib/db";
import { formatPhone } from "@/lib/format";
import { suggestedDuplicateSellerIds } from "@/lib/seller-profiles";
import type { SellerProfile } from "@/lib/types";

export function SellerMergeSheet({
  profile,
  profiles,
  onOpenChange,
  onMerged,
}: {
  profile: SellerProfile;
  profiles: SellerProfile[];
  onOpenChange: (open: boolean) => void;
  onMerged: (targetSellerProfileId: string) => void;
}) {
  const { toast } = useToast();
  const candidates = profiles.filter((candidate) => candidate.id !== profile.id);
  const suggestedIds = suggestedDuplicateSellerIds(profile, profiles);
  const orderedCandidates = [
    ...candidates.filter((candidate) => suggestedIds.includes(candidate.id)),
    ...candidates.filter((candidate) => !suggestedIds.includes(candidate.id)),
  ];
  const candidateItems = orderedCandidates.map((candidate) => ({
    value: candidate.id,
    label: suggestedIds.includes(candidate.id)
      ? `${candidate.name} · مشابه`
      : candidate.name,
  }));
  const [targetId, setTargetId] = React.useState(orderedCandidates[0]?.id ?? "");
  const [confirmed, setConfirmed] = React.useState(false);
  const [merging, setMerging] = React.useState(false);
  const target = orderedCandidates.find((candidate) => candidate.id === targetId);

  async function merge() {
    if (!target || !confirmed) return;
    setMerging(true);
    try {
      await mergeSellerProfiles(profile.id, target.id);
      toast(`«${profile.name}» با «${target.name}» ادغام شد.`);
      onMerged(target.id);
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "ادغام فروشنده‌ها انجام نشد.",
        "error"
      );
      setMerging(false);
    }
  }

  return (
    <ResponsiveSheet
      open
      onOpenChange={onOpenChange}
      title="ادغام فروشنده‌های تکراری"
      description="سابقه استعلام، خرید، امتیاز و پیگیری‌ها روی یک پروفایل واحد جمع می‌شود."
    >
      <div className="space-y-4 p-4 sm:p-5">
        <div className="rounded-2xl border border-border bg-muted/35 p-3.5">
          <div className="type-caption text-muted-foreground">پروفایل فعلی</div>
          <div className="type-card-title mt-1">{profile.name}</div>
          {profile.phone ? (
            <div className="type-caption mt-1 text-muted-foreground" dir="ltr">
              {formatPhone(profile.phone)}
            </div>
          ) : null}
        </div>

        {orderedCandidates.length ? (
          <>
            <div>
              <label className="type-label mb-2 block">پروفایلی که باقی می‌ماند</label>
              <Select<string>
                value={targetId}
                onValueChange={(value) => value && setTargetId(value)}
                items={candidateItems}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="فروشنده را انتخاب کن" />
                </SelectTrigger>
                <SelectContent>
                  {orderedCandidates.map((candidate) => (
                    <SelectItem key={candidate.id} value={candidate.id}>
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate">{candidate.name}</span>
                        {suggestedIds.includes(candidate.id) ? (
                          <Badge variant="secondary">مشابه</Badge>
                        ) : null}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {target?.phone ? (
                <p className="type-caption mt-2 text-muted-foreground">
                  شماره اصلی مقصد: <span dir="ltr">{formatPhone(target.phone)}</span>
                </p>
              ) : null}
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3.5 text-amber-900 dark:text-amber-100">
              <div className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                <div>
                  <div className="type-label">این کار ساختار داده را یکی می‌کند</div>
                  <p className="type-caption mt-1 leading-6">
                    پروفایل فعلی حذف می‌شود، اما استعلام‌ها و خریدهایش پاک نمی‌شوند. اگر هر دو فروشنده در یک پرونده باشند، ردیف‌های تکراری همان پرونده هم به یک فروشنده وصل می‌شوند.
                  </p>
                </div>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-background/55 p-3">
              <Checkbox
                checked={confirmed}
                onCheckedChange={(value) => setConfirmed(value === true)}
                aria-label="تأیید ادغام فروشنده‌ها"
              />
              <span className="type-caption leading-6">
                مطمئنم این دو پروفایل متعلق به یک فروشنده هستند.
              </span>
            </label>

            <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                انصراف
              </Button>
              <Button
                type="button"
                loading={merging}
                disabled={!targetId || !confirmed}
                onClick={() => void merge()}
              >
                <GitMerge />
                ادغام در پروفایل انتخاب‌شده
              </Button>
            </div>
          </>
        ) : (
          <p className="type-body text-muted-foreground">
            فروشنده دیگری برای ادغام وجود ندارد.
          </p>
        )}
      </div>
    </ResponsiveSheet>
  );
}
