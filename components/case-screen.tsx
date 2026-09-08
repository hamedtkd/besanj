"use client";

import * as React from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Archive,
  BarChart3,
  BellRing,
  FileDown,
  ListChecks,
  WalletCards,
  CirclePlus,
  GitCompareArrows,
  Package,
  RefreshCw,
  ScrollText,
  ShoppingBag,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { CaseDetailsPanel } from "@/components/case-details-panel";
import { CaseFollowUpSheet } from "@/components/case-follow-up-sheet";
import { CaseTimeline } from "@/components/case-timeline";
import { DecisionAssistant } from "@/components/decision-assistant";
import { EmptyState } from "@/components/empty-state";
import { PriceHistoryChart } from "@/components/price-history-chart";
import { PurchaseOutcomeCard } from "@/components/purchase-outcome-card";
import { PurchaseOutcomeSheet } from "@/components/purchase-outcome-sheet";
import { QuoteComparison } from "@/components/quote-comparison";
import { QuoteFilters } from "@/components/quote-filters";
import { QuoteFormDialog, type RequotePreset } from "@/components/quote-form-dialog";
import { QuoteHistory } from "@/components/quote-history";
import { SideBySideComparison } from "@/components/side-by-side-comparison";
import { useToast } from "@/components/toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TomanIcon } from "@/components/ui/toman-icon";
import { db, selectQuote } from "@/lib/db";
import { cleanDisplayText, formatToman, kindLabel } from "@/lib/format";
import { EMPTY_QUOTE_FILTERS, filterQuotes } from "@/lib/quote-filters";
import { buildCaseMetrics } from "@/lib/quote";
import { MAX_COMPARE_QUOTES, toggleShortlist } from "@/lib/shortlist";
import type { Provider, Quote, QuoteFilterState } from "@/lib/types";

export function CaseScreen({ caseId }: { caseId: string }) {
  const { toast } = useToast();
  const [quoteOpen, setQuoteOpen] = React.useState(false);
  const [followUpOpen, setFollowUpOpen] = React.useState(false);
  const [purchaseOutcomeOpen, setPurchaseOutcomeOpen] = React.useState(false);
  const [followUpProviderId, setFollowUpProviderId] = React.useState<string | undefined>(undefined);
  const [preset, setPreset] = React.useState<RequotePreset | null>(null);
  const [activeTab, setActiveTab] = React.useState("compare");
  const [historyProviderId, setHistoryProviderId] = React.useState("all");
  const [requestedComparedQuoteIds, setRequestedComparedQuoteIds] = React.useState<string[]>([]);
  const [sideBySideOpen, setSideBySideOpen] = React.useState(false);
  const [filters, setFilters] = React.useState<QuoteFilterState>({ ...EMPTY_QUOTE_FILTERS });

  const data = useLiveQuery(async () => {
    const [purchaseCase, providers, allProviders, quotes, reminders, attachments] = await Promise.all([
      db.purchaseCases.get(caseId),
      db.providers.where("caseId").equals(caseId).toArray(),
      db.providers.toArray(),
      db.quotes.where("caseId").equals(caseId).toArray(),
      db.reminders.where("caseId").equals(caseId).toArray(),
      db.attachments.where("caseId").equals(caseId).toArray(),
    ]);
    return { purchaseCase, providers, allProviders, quotes, reminders, attachments };
  }, [caseId]);

  const availableQuoteIds = data
    ? new Set(buildCaseMetrics(data.quotes).latestQuotes.map((quote) => quote.id))
    : new Set<string>();
  const comparedQuoteIds = requestedComparedQuoteIds.filter((id) =>
    availableQuoteIds.has(id)
  );

  if (!data) return <CaseSkeleton />;

  const purchaseCase = data.purchaseCase;

  if (!purchaseCase) {
    return (
      <EmptyState
        title="پرونده پیدا نشد"
        description="ممکن است این پرونده پاک شده باشد یا آدرس اشتباه باشد."
        action={
          <Button nativeButton={false} render={<Link href="/" />}>
            بازگشت به پرونده‌ها
          </Button>
        }
      />
    );
  }

  const selectedQuoteId = purchaseCase.selectedQuoteId;
  const metrics = buildCaseMetrics(data.quotes);
  const selectedQuote = selectedQuoteId
    ? data.quotes.find((quote) => quote.id === selectedQuoteId)
    : undefined;
  const selectedProvider = selectedQuote
    ? data.providers.find((provider) => provider.id === selectedQuote.providerId)
    : undefined;
  const outcomeQuote = purchaseCase.purchaseOutcome
    ? data.quotes.find((quote) => quote.id === purchaseCase.purchaseOutcome?.quoteId)
    : selectedQuote;
  const outcomeProvider = outcomeQuote
    ? data.providers.find((provider) => provider.id === outcomeQuote.providerId)
    : undefined;
  const filteredQuotes = filterQuotes(metrics.latestQuotes, data.providers, filters);
  const comparedQuotes = metrics.latestQuotes.filter((quote) => comparedQuoteIds.includes(quote.id));
  const selectedIsLatest =
    !selectedQuoteId ||
    metrics.latestQuotes.some((quote) => quote.id === selectedQuoteId);
  const attachmentCounts = data.attachments.reduce<Record<string, number>>((counts, attachment) => {
    counts[attachment.quoteId] = (counts[attachment.quoteId] ?? 0) + 1;
    return counts;
  }, {});

  function openNewQuote() {
    setPreset(null);
    setQuoteOpen(true);
  }

  function openRequote(quote: Quote, provider: Provider) {
    setPreset({ quote, provider });
    setQuoteOpen(true);
  }

  function toggleCompare(quote: Quote) {
    const result = toggleShortlist(comparedQuoteIds, quote.id);
    if (result.limitReached) {
      toast(`حداکثر ${MAX_COMPARE_QUOTES.toLocaleString("fa-IR")} گزینه را می‌توانی هم‌زمان مقایسه کنی.`, "error");
      return;
    }
    setRequestedComparedQuoteIds(result.ids);
  }

  function openProviderHistory(providerId: string) {
    setHistoryProviderId(providerId);
    setActiveTab("history");
  }

  async function chooseQuote(quote: Quote) {
    try {
      if (selectedQuoteId === quote.id) {
        await selectQuote(caseId, undefined);
        toast("انتخاب نهایی پاک شد.");
      } else {
        await selectQuote(caseId, quote.id);
        toast("این استعلام به‌عنوان انتخاب نهایی ثبت شد.");
      }
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "تغییر انتخاب انجام نشد.",
        "error"
      );
    }
  }

  const caseDescription = cleanDisplayText(purchaseCase.description);

  return (
    <>
      <section className="mb-5 sm:mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                {purchaseCase.kind === "product" ? <Package className="size-4.5" /> : <Stethoscope className="size-4.5" />}
              </span>
              <Badge variant="outline">{kindLabel(purchaseCase.kind)}</Badge>
              <Badge variant={purchaseCase.status === "decided" ? "success" : purchaseCase.status === "archived" ? "outline" : "secondary"}>
                {purchaseCase.status === "active" ? "فعال" : purchaseCase.status === "decided" ? "تصمیم‌گرفته" : "آرشیو"}
              </Badge>
            </div>
            <h1 className="type-page-title mt-3">{purchaseCase.title}</h1>
            {caseDescription ? <p className="type-body mt-2 max-w-2xl text-muted-foreground">{caseDescription}</p> : null}
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              nativeButton={false}
              render={<Link href={`/cases/${caseId}/report`} />}
              size="lg"
              variant="outline"
            >
              <FileDown />گزارش
            </Button>
            {selectedQuote && selectedProvider ? (
              <Button
                type="button"
                size="lg"
                variant="outline"
                onClick={() => setPurchaseOutcomeOpen(true)}
              >
                <ShoppingBag />
                {purchaseCase.purchaseOutcome ? "نتیجه خرید" : "ثبت خرید"}
              </Button>
            ) : null}
            <Button
              type="button"
              size="lg"
              variant="outline"
              onClick={() => {
                setFollowUpProviderId(undefined);
                setFollowUpOpen(true);
              }}
            >
              <BellRing />پیگیری
            </Button>
            <Button type="button" size="lg" onClick={openNewQuote}>
              <CirclePlus />ثبت استعلام
            </Button>
          </div>
        </div>
      </section>

      <section className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">
        <MetricCard label="کمترین قیمت" value={metrics.minTotal} />
        <MetricCard label="بیشترین قیمت" value={metrics.maxTotal} />
        <MetricCard label="اختلاف" value={metrics.spread} />
      </section>

      {purchaseCase.targetBudgetToman || purchaseCase.requirements?.length ? (
        <section className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-border bg-card/65 p-3">
          {purchaseCase.targetBudgetToman ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary/[0.07] px-3 py-2 text-sm text-primary">
              <WalletCards className="size-4" />
              بودجه هدف: <span className="type-data">{formatToman(purchaseCase.targetBudgetToman)}</span>
              <TomanIcon className="size-3.5" />
            </span>
          ) : null}
          {purchaseCase.requirements?.length ? (
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">
              <ListChecks className="size-4" />
              {purchaseCase.requirements.length.toLocaleString("fa-IR")} شرط مهم
            </span>
          ) : null}
        </section>
      ) : null}

      {purchaseCase.purchaseOutcome && outcomeQuote && outcomeProvider ? (
        <PurchaseOutcomeCard
          purchaseCase={purchaseCase}
          quote={outcomeQuote}
          provider={outcomeProvider}
          latestQuotes={metrics.latestQuotes}
          onEdit={() => setPurchaseOutcomeOpen(true)}
        />
      ) : selectedQuote && selectedProvider ? (
        <Card className="mb-6 border-primary/20 bg-primary/[0.045] p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShoppingBag className="size-5" />
              </span>
              <div>
                <h2 className="type-card-title">تصمیم ثبت شده؛ نتیجه واقعی خرید را هم نگه دار</h2>
                <p className="type-caption mt-1 text-muted-foreground">
                  مبلغ پرداخت‌شده، شماره سفارش و وضعیت تحویل را ثبت کن تا این پرونده واقعاً کامل شود.
                </p>
              </div>
            </div>
            <Button type="button" onClick={() => setPurchaseOutcomeOpen(true)}>
              <ShoppingBag />ثبت نتیجه خرید
            </Button>
          </div>
        </Card>
      ) : null}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(String(value))} variant="line">
        <TabsList className="overflow-x-auto hide-scrollbar">
          <TabsTrigger value="compare"><GitCompareArrows className="size-3.5" />مقایسه</TabsTrigger>
          <TabsTrigger value="decision"><Sparkles className="size-3.5" />تصمیم‌یار {comparedQuoteIds.length ? <span className="type-data text-xs opacity-60">{comparedQuoteIds.length.toLocaleString("fa-IR")}</span> : null}</TabsTrigger>
          <TabsTrigger value="chart"><BarChart3 className="size-3.5" />نمودار</TabsTrigger>
          <TabsTrigger value="history">تاریخچه <span className="type-data text-xs opacity-60">{data.quotes.length.toLocaleString("fa-IR")}</span></TabsTrigger>
          <TabsTrigger value="timeline"><ScrollText className="size-3.5" />رویدادها</TabsTrigger>
          <TabsTrigger value="details">جزئیات</TabsTrigger>
        </TabsList>

        <TabsContent value="compare">
          {metrics.latestQuotes.length ? (
            <>
              {!selectedIsLatest ? (
                <div className="mb-3 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-3 text-amber-800 dark:text-amber-200">
                  <p className="type-caption">فروشنده‌ای که قبلاً انتخاب کرده بودی قیمت جدید داده است. انتخاب نهایی هنوز به قیمت قبلی اشاره می‌کند؛ یکی از قیمت‌های فعلی را دوباره انتخاب کن.</p>
                </div>
              ) : null}

              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="type-caption text-muted-foreground">آخرین قیمت هر فروشنده نمایش داده می‌شود؛ قیمت‌های قبلی در تاریخچه و نمودار می‌مانند.</p>
                {metrics.latestQuotes.some((quote) => new Date().getTime() - new Date(quote.quotedAt).getTime() > 3 * 86_400_000) ? (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300"><RefreshCw className="size-3.5" />بعضی قیمت‌ها قدیمی شده‌اند</span>
                ) : null}
              </div>

              <QuoteFilters
                value={filters}
                onChange={setFilters}
                resultCount={filteredQuotes.length}
                totalCount={metrics.latestQuotes.length}
                providers={data.providers}
              />

              {filteredQuotes.length ? (
                <QuoteComparison
                  quotes={filteredQuotes}
                  providers={data.providers}
                  selectedQuoteId={purchaseCase.selectedQuoteId}
                  comparedQuoteIds={comparedQuoteIds}
                  onSelect={chooseQuote}
                  onToggleCompare={toggleCompare}
                  onRequote={openRequote}
                  onOpenHistory={openProviderHistory}
                  onFollowUp={(provider) => {
                    setFollowUpProviderId(provider.id);
                    setFollowUpOpen(true);
                  }}
                  targetBudgetToman={purchaseCase.targetBudgetToman}
                  requirements={purchaseCase.requirements}
                  attachmentCounts={attachmentCounts}
                  caseTitle={purchaseCase.title}
                />
              ) : (
                <EmptyState
                  title="گزینه‌ای با این فیلترها نیست"
                  description="فیلترها را سبک‌تر کن یا پاکشان کن تا همه قیمت‌ها دوباره دیده شوند."
                  action={<Button type="button" variant="outline" onClick={() => setFilters({ ...EMPTY_QUOTE_FILTERS })}>پاک کردن فیلترها</Button>}
                />
              )}

              {comparedQuoteIds.length ? (
                <div className="sticky bottom-3 z-20 mx-auto mt-4 flex max-w-xl items-center justify-between gap-2 rounded-2xl border border-primary/20 bg-popover/95 p-2.5 shadow-xl backdrop-blur">
                  <div className="flex min-w-0 items-center gap-2 px-1">
                    <GitCompareArrows className="size-4 shrink-0 text-primary" />
                    <span className="type-label truncate">{comparedQuoteIds.length.toLocaleString("fa-IR")} گزینه برای تصمیم</span>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <Button type="button" size="icon-sm" variant="ghost" aria-label="پاک کردن انتخاب‌ها" title="پاک کردن انتخاب‌ها" onClick={() => setRequestedComparedQuoteIds([])}><X /></Button>
                    <Button type="button" size="sm" variant="outline" disabled={comparedQuoteIds.length < 2} onClick={() => setSideBySideOpen(true)}>کنار هم</Button>
                    <Button type="button" size="sm" disabled={comparedQuoteIds.length < 2} onClick={() => setActiveTab("decision")}><Sparkles className="size-3.5" />تصمیم‌یار</Button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="هنوز قیمتی ثبت نشده"
              description="اولین تماس یا استعلامت را ثبت کن؛ از استعلام دوم به بعد مقایسه واقعاً مفید می‌شود."
              action={<Button type="button" onClick={openNewQuote}><CirclePlus />ثبت اولین استعلام</Button>}
            />
          )}
        </TabsContent>

        <TabsContent value="chart">
          {data.quotes.length ? (
            <PriceHistoryChart quotes={data.quotes} providers={data.providers} />
          ) : (
            <EmptyState title="هنوز داده‌ای برای نمودار نیست" description="با ثبت قیمت‌ها، روند هر فروشنده اینجا رسم می‌شود." />
          )}
        </TabsContent>

        <TabsContent value="history">
          {data.quotes.length ? (
            <QuoteHistory
              quotes={data.quotes}
              providers={data.providers}
              selectedProviderId={historyProviderId}
              onSelectedProviderChange={setHistoryProviderId}
            />
          ) : (
            <EmptyState title="تاریخچه خالی است" description="با ثبت اولین قیمت، روند تغییرات اینجا شکل می‌گیرد." />
          )}
        </TabsContent>

        <TabsContent value="timeline">
          <CaseTimeline
            purchaseCase={purchaseCase}
            providers={data.providers}
            quotes={data.quotes}
            reminders={data.reminders}
            attachments={data.attachments}
          />
        </TabsContent>

        <TabsContent value="decision">
          <DecisionAssistant
            key={`${purchaseCase.targetBudgetToman ?? "none"}:${(purchaseCase.requirements ?? []).map((item) => item.id).join("|")}`}
            availableQuotes={metrics.latestQuotes}
            selectedQuoteIds={comparedQuoteIds}
            providers={data.providers}
            selectedQuoteId={purchaseCase.selectedQuoteId}
            onToggleQuote={toggleCompare}
            onClearQuotes={() => setRequestedComparedQuoteIds([])}
            onOpenSideBySide={() => setSideBySideOpen(true)}
            onSelect={chooseQuote}
            targetBudgetToman={purchaseCase.targetBudgetToman}
            requirements={purchaseCase.requirements}
          />
        </TabsContent>

        <TabsContent value="details">
          <CaseDetailsPanel
            purchaseCase={purchaseCase}
            quotes={data.quotes}
            providers={data.providers}
            reminders={data.reminders}
            attachments={data.attachments}
          />
        </TabsContent>
      </Tabs>

      {purchaseCase.status === "archived" ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-3.5 py-3 text-muted-foreground">
          <Archive className="size-4" /><span className="type-caption">این پرونده آرشیو شده، اما هنوز می‌توانی قیمت‌های جدید ثبت کنی.</span>
        </div>
      ) : null}

      <QuoteFormDialog
        key={`${quoteOpen ? "open" : "closed"}:${preset?.quote.id ?? "new"}`}
        caseId={caseId}
        open={quoteOpen}
        onOpenChange={(open) => {
          setQuoteOpen(open);
          if (!open) setPreset(null);
        }}
        preset={preset}
        requirements={purchaseCase.requirements}
        providers={data.providers}
        allProviders={data.allProviders}
      />

      {purchaseOutcomeOpen && outcomeQuote && outcomeProvider ? (
        <PurchaseOutcomeSheet
          key={`${outcomeQuote.id}:${purchaseCase.purchaseOutcome?.updatedAt ?? "new"}`}
          purchaseCase={purchaseCase}
          quote={outcomeQuote}
          provider={outcomeProvider}
          onOpenChange={setPurchaseOutcomeOpen}
        />
      ) : null}

      {followUpOpen ? (
        <CaseFollowUpSheet
          key={followUpProviderId ?? "case"}
          caseId={caseId}
          providers={data.providers}
          initialProviderId={followUpProviderId}
          onOpenChange={(open) => {
            setFollowUpOpen(open);
            if (!open) setFollowUpProviderId(undefined);
          }}
        />
      ) : null}

      <SideBySideComparison
        open={sideBySideOpen}
        onOpenChange={setSideBySideOpen}
        quotes={comparedQuotes}
        providers={data.providers}
        targetBudgetToman={purchaseCase.targetBudgetToman}
        requirements={purchaseCase.requirements}
        onRemove={(quoteId) => setRequestedComparedQuoteIds((current) => current.filter((id) => id !== quoteId))}
        onOpenDecision={() => {
          setSideBySideOpen(false);
          setActiveTab("decision");
        }}
      />
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: number | null }) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="type-caption text-muted-foreground">{label}</div>
      <div className="type-data mt-1.5 inline-flex min-w-0 items-center gap-1 text-base sm:text-lg">
        <span className="truncate">{formatToman(value)}</span>{value !== null ? <TomanIcon className="size-3.5 shrink-0" /> : null}
      </div>
    </Card>
  );
}

function CaseSkeleton() {
  return (
    <div className="animate-pulse space-y-5">
      <div className="h-8 w-56 rounded-xl bg-muted" />
      <div className="h-5 w-full max-w-xl rounded-lg bg-muted" />
      <div className="grid grid-cols-3 gap-2">{Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 rounded-2xl bg-muted" />)}</div>
      <div className="h-10 w-72 rounded-xl bg-muted" />
      <div className="grid gap-3 md:grid-cols-2">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-72 rounded-2xl bg-muted" />)}</div>
    </div>
  );
}
