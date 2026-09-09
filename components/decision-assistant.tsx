"use client";

import * as React from "react";
import {
  CheckCircle2,
  CircleAlert,
  CircleCheck,
  GitCompareArrows,
  Sparkles,
  Trophy,
} from "lucide-react";
import { HelpHint } from "@/components/help-hint";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group";
import { PriceInput } from "@/components/ui/price-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TomanIcon } from "@/components/ui/toman-icon";
import { DEFAULT_DECISION_PREFERENCES, scoreQuotesForDecision } from "@/lib/decision";
import { channelLabel, formatToman } from "@/lib/format";
import { freshnessLabel, getQuoteFreshness, quoteTotal } from "@/lib/quote";
import { MAX_COMPARE_QUOTES } from "@/lib/shortlist";
import type { CaseRequirement, DecisionPreferences, DecisionProfile, Provider, Quote } from "@/lib/types";
import { cn } from "@/lib/utils";

const PROFILE_LABELS: Record<DecisionProfile, string> = {
  balanced: "متعادل",
  cheapest: "قیمت مهم‌تر است",
  fastest: "تحویل سریع مهم‌تر است",
  freshest: "تازگی قیمت مهم‌تر است",
  warranty: "گارانتی مهم‌تر است",
};

const PROFILE_ITEMS = Object.entries(PROFILE_LABELS).map(([value, label]) => ({
  value: value as DecisionProfile,
  label,
}));

const DELIVERY_ITEMS = [
  { value: "all", label: "مهم نیست" },
  { value: "0", label: "فقط فوری" },
  { value: "3", label: "حداکثر ۳ روز" },
  { value: "7", label: "حداکثر ۷ روز" },
  { value: "14", label: "حداکثر ۱۴ روز" },
  { value: "30", label: "حداکثر ۳۰ روز" },
];

export function DecisionAssistant({
  availableQuotes,
  selectedQuoteIds,
  providers,
  selectedQuoteId,
  onToggleQuote,
  onClearQuotes,
  onOpenSideBySide,
  onSelect,
  targetBudgetToman,
  requirements = [],
}: {
  availableQuotes: Quote[];
  selectedQuoteIds: string[];
  providers: Provider[];
  selectedQuoteId?: string;
  onToggleQuote: (quote: Quote) => void;
  onClearQuotes: () => void;
  onOpenSideBySide: () => void;
  onSelect: (quote: Quote) => void;
  targetBudgetToman?: number;
  requirements?: CaseRequirement[];
}) {
  const [preferences, setPreferences] = React.useState<DecisionPreferences>({
    ...DEFAULT_DECISION_PREFERENCES,
    maxBudgetToman: targetBudgetToman ?? null,
  });
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const selectedQuotes = availableQuotes.filter((quote) => selectedQuoteIds.includes(quote.id));
  const quoteById = new Map(selectedQuotes.map((quote) => [quote.id, quote]));
  const providerRatings = Object.fromEntries(
    providers.map((provider) => [provider.id, provider.rating])
  );
  const results = scoreQuotesForDecision(selectedQuotes, preferences, new Date(), {
    providerRatings,
    requirements,
  });
  const best = results.find((result) => result.eligible);

  const patch = <K extends keyof DecisionPreferences>(key: K, value: DecisionPreferences[K]) =>
    setPreferences((current) => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-start gap-3">
            <StepBadge step="۱" />
            <div className="flex items-center gap-1.5">
              <h2 className="type-section-title">گزینه‌های تصمیم را انتخاب کن</h2>
              <HelpHint label="راهنمای گزینه‌های تصمیم">
                از همین‌جا دو تا چهار فروشنده را اضافه یا حذف کن؛ انتخاب‌ها با تب مقایسه همگام می‌مانند.
              </HelpHint>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={selectedQuotes.length >= 2 ? "success" : "secondary"}>
              {selectedQuotes.length.toLocaleString("fa-IR-u-nu-arabext")} از {MAX_COMPARE_QUOTES.toLocaleString("fa-IR-u-nu-arabext")}
            </Badge>
            {selectedQuotes.length >= 2 ? (
              <Button type="button" size="sm" variant="outline" onClick={onOpenSideBySide}>
                <GitCompareArrows />کنار هم
              </Button>
            ) : null}
            {selectedQuotes.length ? (
              <Button type="button" size="sm" variant="ghost" onClick={onClearQuotes}>
                پاک کردن
              </Button>
            ) : null}
          </div>
        </div>

        <div className="grid gap-2 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
          {availableQuotes.map((quote) => {
            const provider = providerById.get(quote.providerId);
            if (!provider) return null;
            const selected = selectedQuoteIds.includes(quote.id);
            const disabled = !selected && selectedQuoteIds.length >= MAX_COMPARE_QUOTES;
            const freshness = getQuoteFreshness(quote);
            return (
              <label
                key={quote.id}
                className={cn(
                  "flex min-w-0 cursor-pointer items-start gap-3 rounded-2xl border border-border bg-background p-3 transition-[border-color,background-color,box-shadow,transform] hover:-translate-y-0.5 hover:shadow-sm",
                  selected && "border-primary/35 bg-primary/[0.045] ring-1 ring-primary/15",
                  disabled && "cursor-not-allowed opacity-50"
                )}
              >
                <Checkbox
                  checked={selected}
                  disabled={disabled}
                  onCheckedChange={() => onToggleQuote(quote)}
                  className="mt-1"
                  aria-label={`انتخاب ${provider.name} برای تصمیم‌یار`}
                />
                <span className="min-w-0 flex-1">
                  <span className="type-label block truncate">{provider.name}</span>
                  <span className="type-caption mt-0.5 block truncate text-muted-foreground">
                    {channelLabel(quote.channel)} · {freshnessLabel(freshness)}
                  </span>
                  <span className="type-data mt-2 inline-flex items-center gap-1 text-sm">
                    {formatToman(quoteTotal(quote))}
                    <TomanIcon className="size-3.5 text-muted-foreground" />
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      {selectedQuotes.length < 2 ? (
        <Card className="p-7 text-center sm:p-9">
          <Sparkles className="mx-auto size-6 text-primary" />
          <h2 className="type-section-title mt-3">حداقل دو گزینه لازم است</h2>
          <p className="type-body mx-auto mt-1 max-w-lg text-muted-foreground">
            دو فروشگاه را از بخش بالا انتخاب کن؛ بعد اولویت‌ها و نتیجه پیشنهادی همین‌جا باز می‌شوند.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
          <Card className="h-fit p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <StepBadge step="۲" />
              <div className="flex items-center gap-1.5">
                <h2 className="type-section-title">اولویت‌ها و محدودیت‌ها</h2>
                <HelpHint label="راهنمای امتیاز تصمیم‌یار">
                  امتیاز فقط اطلاعات ثبت‌شده خودت را مرتب می‌کند و درباره کیفیت واقعی فروشنده قضاوت نمی‌کند.
                </HelpHint>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              <FormField label="چه چیزی برایت مهم‌تر است؟">
                <Select<DecisionProfile>
                  value={preferences.profile}
                  onValueChange={(next) => { if (next !== null) patch("profile", next); }}
                  items={PROFILE_ITEMS}
                >
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PROFILE_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField label="سقف بودجه" hint="اختیاری؛ گزینه بالاتر از این سقف رد می‌شود.">
                <InputGroup className="h-10">
                  <PriceInput
                    data-slot="input-group-control"
                    value={preferences.maxBudgetToman}
                    onValueChange={(value) => patch("maxBudgetToman", value)}
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
                {targetBudgetToman ? (
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="type-caption text-muted-foreground">بودجه ثبت‌شده پرونده</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => patch("maxBudgetToman", targetBudgetToman ?? null)}
                    >
                      استفاده از بودجه پرونده
                    </Button>
                  </div>
                ) : null}
              </FormField>

              <FormField label="حداکثر زمان تحویل">
                <Select<string>
                  value={preferences.maxDeliveryDays === null ? "all" : String(preferences.maxDeliveryDays)}
                  onValueChange={(next) => { if (next !== null) patch("maxDeliveryDays", next === "all" ? null : Number(next)); }}
                  items={DELIVERY_ITEMS}
                >
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DELIVERY_ITEMS.map((item) => (
                      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/50 p-3">
                <Checkbox
                  checked={preferences.requireFresh}
                  onCheckedChange={(checked) => patch("requireFresh", checked === true)}
                  className="mt-0.5"
                />
                <span className="min-w-0 flex-1">
                  <span className="type-label flex items-center gap-1">
                    فقط قیمت تازه
                    <HelpHint label="راهنمای قیمت تازه">
                      قیمت‌های قدیمی یا منقضی از پیشنهاد اصلی کنار گذاشته شوند.
                    </HelpHint>
                  </span>
                </span>
              </label>
            </div>
          </Card>

          <div className="space-y-3">
            <div className="mb-1 flex items-center gap-3 px-1">
              <StepBadge step="۳" />
              <div className="flex items-center gap-1.5">
                <h2 className="type-section-title">نتیجه تصمیم‌یار</h2>
                <HelpHint label="راهنمای نتیجه تصمیم‌یار">
                  رتبه‌بندی بر اساس اولویت‌ها و محدودیت‌های فعلی انجام می‌شود.
                </HelpHint>
              </div>
            </div>

            {best ? (
              <Card className="border-primary/25 bg-primary/5 p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                      <Trophy className="size-5" />
                    </span>
                    <div>
                      <div className="type-caption text-muted-foreground">پیشنهاد اول با تنظیمات فعلی</div>
                      <h3 className="type-section-title mt-0.5">
                        {providerById.get(quoteById.get(best.quoteId)?.providerId ?? "")?.name ?? "گزینه منتخب"}
                      </h3>
                      <p className="type-caption mt-1 text-muted-foreground">
                        امتیاز کمکی {best.score.toLocaleString("fa-IR-u-nu-arabext")} از ۱۰۰
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant={
                      selectedQuoteId === best.quoteId ? "secondary" : "default"
                    }
                    disabled={selectedQuoteId === best.quoteId}
                    onClick={() => {
                      const quote = quoteById.get(best.quoteId);
                      if (quote) onSelect(quote);
                    }}
                  >
                    <CheckCircle2 />
                    {selectedQuoteId === best.quoteId
                      ? "انتخاب نهایی فعلی"
                      : "نهایی‌کردن این گزینه"}
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                  <p className="type-caption">هیچ گزینه‌ای همه شرط‌های سخت فعلی را پاس نمی‌کند. سقف بودجه، زمان تحویل یا شرط تازگی را بازبینی کن.</p>
                </div>
              </div>
            )}

            {results.map((result, index) => {
              const quote = quoteById.get(result.quoteId);
              if (!quote) return null;
              const provider = providerById.get(quote.providerId);
              if (!provider) return null;
              const selected = selectedQuoteId === quote.id;
              return (
                <Card
                  key={quote.id}
                  className={cn(
                    "p-4 sm:p-5",
                    !result.eligible && "opacity-65",
                    selected && "border-primary/30 ring-1 ring-primary/20"
                  )}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={index === 0 && result.eligible ? "default" : "secondary"}>
                          رتبه {(index + 1).toLocaleString("fa-IR-u-nu-arabext")}
                        </Badge>
                        {!result.eligible ? <Badge variant="warning">خارج از شروط</Badge> : null}
                        {selected ? <Badge variant="success"><CircleCheck />انتخاب نهایی فعلی</Badge> : null}
                      </div>
                      <h3 className="type-card-title mt-2">{provider.name}</h3>
                      <div className="type-data mt-1 inline-flex items-center gap-1 text-lg">
                        {formatToman(quoteTotal(quote))}<TomanIcon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {result.reasons.map((reason) => (
                          <span key={reason} className="rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground">{reason}</span>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 text-end">
                      <div className="type-data text-2xl text-primary">{result.score.toLocaleString("fa-IR-u-nu-arabext")}</div>
                      <div className="type-caption text-muted-foreground">از ۱۰۰</div>
                      <Button
                        type="button"
                        size="sm"
                        variant={selected ? "outline" : "default"}
                        className="mt-3"
                        onClick={() => onSelect(quote)}
                      >
                        {selected ? "لغو انتخاب نهایی" : "انتخاب نهایی"}
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StepBadge({ step }: { step: string }) {
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
      {step}
    </span>
  );
}
