"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import {
  CheckCircle2,
  CircleAlert,
  ClipboardPaste,
  Package,
  Sparkles,
  Stethoscope,
  Zap,
} from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { LocalVoiceCapture } from "@/components/local-voice-capture";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { addQuote, createPurchaseCase, db } from "@/lib/db";
import { dateToIso, formatPhone, formatToman } from "@/lib/format";
import {
  QUICK_CAPTURE_DRAFT_KEY,
  parseQuickToman,
  type QuickCaptureDraftState,
} from "@/lib/quick-capture";
import {
  availabilityLabel,
  parseQuoteCapture,
} from "@/lib/quote-capture";
import { toPersianDigits } from "@/lib/persian-number";
import type { PurchaseKind } from "@/lib/types";

const NEW_CASE = "__new_case__";
const NO_SELLER = "__from_text__";

export function QuickCaptureSheet({
  open,
  onOpenChange,
  initialDraft,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDraft?: QuickCaptureDraftState;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [mode, setMode] = React.useState<"case" | "quote">(initialDraft?.mode ?? "quote");
  const [kind, setKind] = React.useState<PurchaseKind>(initialDraft?.kind ?? "product");
  const [text, setText] = React.useState(initialDraft?.text ?? "");
  const [caseId, setCaseId] = React.useState(initialDraft?.caseId ?? NEW_CASE);
  const [caseTitle, setCaseTitle] = React.useState(initialDraft?.caseTitle ?? "");
  const [providerName, setProviderName] = React.useState(initialDraft?.providerName ?? "");
  const [phone, setPhone] = React.useState(initialDraft?.phone ?? "");
  const [sellerProfileId, setSellerProfileId] = React.useState(initialDraft?.sellerProfileId ?? NO_SELLER);
  const [amountText, setAmountText] = React.useState(initialDraft?.amountText ?? "");
  const [saving, setSaving] = React.useState(false);

  const data = useLiveQuery(async () => {
    const [cases, sellers] = await Promise.all([
      db.purchaseCases.orderBy("updatedAt").reverse().filter((row) => row.status === "active").toArray(),
      db.sellerProfiles.orderBy("updatedAt").reverse().toArray(),
    ]);
    return { cases, sellers };
  }, []);

  const parsed = React.useMemo(() => parseQuoteCapture(text), [text]);
  const manualAmount = React.useMemo(() => parseQuickToman(amountText), [amountText]);
  const selectedSeller = data?.sellers.find((seller) => seller.id === sellerProfileId);
  const effectivePrice = amountText.trim() ? manualAmount.valueToman : parsed.priceToman;
  const effectiveTitle = caseTitle.trim() || parsed.subjectTitle?.trim() || "";
  const effectiveProviderName =
    selectedSeller?.name || providerName.trim() || parsed.providerName?.trim() || "";
  const effectivePhone = selectedSeller?.phone || phone.trim() || parsed.phone || "";
  const selectedCase = data?.cases.find((purchaseCase) => purchaseCase.id === caseId);

  function snapshot(overrides: Partial<QuickCaptureDraftState> = {}): QuickCaptureDraftState {
    return {
      mode,
      kind,
      text,
      caseId: caseId === NEW_CASE ? undefined : caseId,
      caseTitle,
      providerName,
      phone,
      sellerProfileId: sellerProfileId === NO_SELLER ? undefined : sellerProfileId,
      amountText,
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
  }

  function persist(overrides: Partial<QuickCaptureDraftState> = {}) {
    if (typeof window === "undefined") return;
    const next = snapshot(overrides);
    const hasContent = Boolean(
      next.text.trim() || next.caseTitle?.trim() || next.providerName?.trim() || next.amountText?.trim()
    );
    if (!hasContent) {
      window.localStorage.removeItem(QUICK_CAPTURE_DRAFT_KEY);
      return;
    }
    window.localStorage.setItem(QUICK_CAPTURE_DRAFT_KEY, JSON.stringify(next));
  }

  function clearDraft() {
    if (typeof window !== "undefined") window.localStorage.removeItem(QUICK_CAPTURE_DRAFT_KEY);
  }

  function changeMode(next: "case" | "quote") {
    setMode(next);
    persist({ mode: next });
  }

  function changeKind(next: PurchaseKind) {
    setKind(next);
    persist({ kind: next });
  }

  function appendTranscript(transcript: string) {
    const next = [text.trim(), transcript.trim()].filter(Boolean).join("\n");
    setText(next);
    persist({ text: next });
  }

  function chooseSeller(next: string | null) {
    if (!next) return;
    setSellerProfileId(next);
    if (next === NO_SELLER) {
      setProviderName("");
      setPhone("");
      persist({ sellerProfileId: undefined, providerName: "", phone: "" });
      return;
    }
    const seller = data?.sellers.find((row) => row.id === next);
    if (seller) {
      setProviderName(seller.name);
      setPhone(seller.phone ?? "");
      persist({
        sellerProfileId: seller.id,
        providerName: seller.name,
        phone: seller.phone,
      });
    }
  }

  async function saveCaseOnly() {
    const title = (parsed.subjectTitle?.trim() || text.trim().split(/\r?\n/)[0] || effectiveTitle).trim();
    if (title.length < 2) {
      toast("فقط یک عنوان کوتاه برای خرید یا خدمت بنویس.", "error");
      return;
    }
    setSaving(true);
    try {
      const row = await createPurchaseCase({
        title: title.slice(0, 120),
        kind,
        categoryKey: "other",
      });
      clearDraft();
      toast("پرونده سریع ساخته شد.");
      onOpenChange(false);
      router.push(`/cases/${row.id}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "ساخت پرونده انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function saveQuote() {
    if (!effectivePrice || effectivePrice <= 0) {
      toast("قیمت پیدا نشد. مبلغ را کوتاه وارد کن، مثلاً «۶۸ میلیون».", "error");
      return;
    }

    let name = effectiveProviderName;
    if (!name && effectivePhone) name = `فروشنده ${toPersianDigits(effectivePhone)}`;
    if (!name) {
      toast("نام یا شماره فروشنده را وارد کن تا استعلام گم نشود.", "error");
      return;
    }

    if (caseId === NEW_CASE && effectiveTitle.length < 2) {
      toast("نام خرید از متن پیدا نشد. یک عنوان کوتاه وارد کن.", "error");
      return;
    }

    setSaving(true);
    try {
      let targetCaseId = selectedCase?.id;
      if (!targetCaseId) {
        const created = await createPurchaseCase({
          title: effectiveTitle.slice(0, 120),
          kind,
          categoryKey: "other",
        });
        targetCaseId = created.id;
      }

      const validUntil =
        parsed.validForDays === undefined
          ? undefined
          : dateToIso(
              new Date(Date.now() + parsed.validForDays * 86_400_000),
              true
            );
      const stock = availabilityLabel(parsed.availability);
      const source = text.trim().slice(0, 820);
      const note = [
        stock ? `وضعیت موجودی: ${stock}` : "",
        source ? `متن ثبت سریع:\n${source}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      await addQuote({
        caseId: targetCaseId,
        providerName: name,
        phone: effectivePhone || undefined,
        sellerProfileId: selectedSeller?.id,
        priceToman: effectivePrice,
        extraCostToman: parsed.extraCostToman,
        quotedAt: dateToIso(new Date()),
        validUntil,
        deliveryDays: parsed.deliveryDays,
        warranty: parsed.warranty,
        paymentTerms: parsed.paymentTerms,
        channel: parsed.channel ?? "other",
        contactRef: parsed.contactRef,
        note: note || undefined,
      });

      clearDraft();
      toast("استعلام سریع ثبت شد.");
      onOpenChange(false);
      router.push(`/cases/${targetCaseId}`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "ثبت سریع انجام نشد.", "error");
    } finally {
      setSaving(false);
    }
  }

  const caseItems = [
    { value: NEW_CASE, label: "پرونده جدید از همین متن" },
    ...(data?.cases.map((purchaseCase) => ({ value: purchaseCase.id, label: purchaseCase.title })) ?? []),
  ];
  const sellerItems = [
    { value: NO_SELLER, label: "فروشنده را از متن بگیر" },
    ...(data?.sellers.slice(0, 30).map((seller) => ({
      value: seller.id,
      label: `${seller.favorite ? "★ " : ""}${seller.name}`,
    })) ?? []),
  ];

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={onOpenChange}
      title="ثبت سریع"
      description="کمترین تایپ ممکن؛ بنویس، Paste کن یا اگر دستگاه اجازه می‌دهد با صدا بگو."
      className="sm:max-w-2xl"
    >
      <div className="grid gap-4 p-4 pb-6 sm:p-5">
        {initialDraft?.text.trim() ? (
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-3 text-amber-900 dark:text-amber-100">
            <div className="type-label">ثبت نیمه‌کاره برگشت</div>
            <p className="type-caption mt-0.5">اطلاعاتی که قبلاً وارد کرده بودی روی همین دستگاه نگه داشته شده بود.</p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-1.5">
          <Button type="button" variant={mode === "quote" ? "default" : "ghost"} onClick={() => changeMode("quote")}>
            <Zap />قیمت جدید
          </Button>
          <Button type="button" variant={mode === "case" ? "default" : "ghost"} onClick={() => changeMode("case")}>
            <Package />خرید جدید
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button type="button" size="sm" variant={kind === "product" ? "secondary" : "ghost"} onClick={() => changeKind("product")}>
            <Package />کالا
          </Button>
          <Button type="button" size="sm" variant={kind === "service" ? "secondary" : "ghost"} onClick={() => changeKind("service")}>
            <Stethoscope />خدمت
          </Button>
        </div>

        {mode === "case" ? (
          <>
            <Input
              autoFocus
              value={text}
              onChange={(event) => {
                const next = event.currentTarget.value;
                setText(next);
                persist({ text: next });
              }}
              placeholder="مثلاً تلویزیون سامسونگ ۵۵ اینچ"
              dir="auto"
              className="h-12 text-base"
            />
            <LocalVoiceCapture onTranscript={appendTranscript} disabled={saving} />
            <Button type="button" size="lg" onClick={saveCaseOnly} disabled={saving || text.trim().length < 2}>
              <CheckCircle2 />{saving ? "در حال ثبت..." : "ساخت پرونده"}
            </Button>
            <div className="flex justify-center">
              <HelpHint label="راهنمای ساخت پرونده سریع">
                دسته، بودجه، برچسب و شرط‌ها بعداً و فقط در صورت نیاز تکمیل می‌شوند.
              </HelpHint>
            </div>
          </>
        ) : (
          <>
            <Select<string>
              value={caseId}
              onValueChange={(next) => {
                if (!next) return;
                setCaseId(next);
                persist({ caseId: next === NEW_CASE ? undefined : next });
              }}
              items={caseItems}
            >
              <SelectTrigger aria-label="پرونده برای ثبت سریع">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {caseItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <ClipboardPaste className="pointer-events-none absolute end-3 top-3 size-4 text-muted-foreground" />
              <Textarea
                autoFocus
                value={text}
                onChange={(event) => {
                  const next = event.currentTarget.value;
                  setText(next);
                  persist({ text: next });
                }}
                dir="auto"
                className="min-h-32 pe-9"
                placeholder="مثلاً: سامسونگ ۵۵ Q۷۰، ۶۸ میلیون، موجود، گارانتی ۱۸ ماه، ارسال فردا، ۰۹۱۲..."
              />
            </div>

            <LocalVoiceCapture onTranscript={appendTranscript} disabled={saving} />

            {caseId === NEW_CASE ? (
              <Input
                value={caseTitle}
                onChange={(event) => {
                  const next = event.currentTarget.value;
                  setCaseTitle(next);
                  persist({ caseTitle: next });
                }}
                placeholder={parsed.subjectTitle ? `عنوان پیشنهادی: ${parsed.subjectTitle}` : "عنوان خرید یا خدمت"}
              />
            ) : null}

            <Select<string> value={sellerProfileId} onValueChange={chooseSeller} items={sellerItems}>
              <SelectTrigger aria-label="انتخاب فروشنده قبلی">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sellerItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {!selectedSeller && !parsed.providerName ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  value={providerName}
                  onChange={(event) => {
                    const next = event.currentTarget.value;
                    setProviderName(next);
                    persist({ providerName: next });
                  }}
                  placeholder="نام فروشنده، اگر از متن پیدا نشد"
                />
                <Input
                  value={phone}
                  onChange={(event) => {
                    const next = event.currentTarget.value;
                    setPhone(next);
                    persist({ phone: next });
                  }}
                  inputMode="tel"
                  dir="ltr"
                  placeholder="شماره فروشنده، اختیاری"
                />
              </div>
            ) : null}

            {!parsed.priceToman || amountText ? (
              <Input
                value={amountText}
                onChange={(event) => {
                  const next = event.currentTarget.value;
                  setAmountText(next);
                  persist({ amountText: next });
                }}
                inputMode="decimal"
                placeholder="مبلغ؛ مثل ۶۸ میلیون یا ۶۸م"
              />
            ) : null}

            <section className="grid gap-3 rounded-2xl border border-primary/20 bg-primary/[0.045] p-3.5">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span className="type-label">پیشنهاد بسنج، قبل از ثبت بررسی کن</span>
                <HelpHint label="راهنمای پیشنهاد بسنج">
                  هیچ مقدار استخراج‌شده‌ای بدون تأیید نهایی تو ذخیره نمی‌شود.
                </HelpHint>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(selectedCase?.title || effectiveTitle) ? <Badge variant="secondary">{selectedCase?.title || effectiveTitle}</Badge> : null}
                {effectiveProviderName ? <Badge variant="outline">{effectiveProviderName}</Badge> : null}
                {effectivePhone ? <Badge variant="outline">{formatPhone(effectivePhone)}</Badge> : null}
                {effectivePrice ? (
                  <Badge variant="success" className="inline-flex items-center gap-1">
                    {formatToman(effectivePrice)} <TomanIcon className="size-3.5" />
                  </Badge>
                ) : null}
                {parsed.warranty ? <Badge variant="outline">گارانتی {parsed.warranty}</Badge> : null}
                {parsed.deliveryDays !== undefined ? <Badge variant="outline">تحویل {parsed.deliveryDays === 0 ? "فوری" : `${toPersianDigits(String(parsed.deliveryDays))} روز`}</Badge> : null}
                {availabilityLabel(parsed.availability) ? <Badge variant="outline">{availabilityLabel(parsed.availability)}</Badge> : null}
              </div>

              {manualAmount.warning ? (
                <div className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  <span className="type-caption">{manualAmount.warning}</span>
                </div>
              ) : null}
              {parsed.warnings.map((warning) => (
                <div key={warning} className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  <span className="type-caption">{warning}</span>
                </div>
              ))}
            </section>

            <Button type="button" size="lg" onClick={saveQuote} disabled={saving}>
              <CheckCircle2 />{saving ? "در حال ثبت..." : "ثبت سریع"}
            </Button>
          </>
        )}
      </div>
    </ResponsiveSheet>
  );
}
