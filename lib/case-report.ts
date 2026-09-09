import { requirementMatchSummary } from "./planning.ts";
import { buildCaseMetrics, quoteTotal } from "./quote.ts";
import { purchaseOutcomeStatusLabel } from "./purchase-outcome.ts";
import { categoryLabelForCase } from "./categories.ts";
import type {
  CaseReminder,
  Provider,
  PurchaseCase,
  Quote,
  QuoteAttachment,
} from "./types.ts";

export type CaseTimelineKind =
  | "case"
  | "provider"
  | "quote"
  | "reminder"
  | "attachment"
  | "decision"
  | "purchase";

export interface CaseTimelineItem {
  id: string;
  kind: CaseTimelineKind;
  at: string;
  title: string;
  detail?: string;
  providerId?: string;
  quoteId?: string;
}

export interface CaseReportQuoteRow {
  quote: Quote;
  provider: Provider;
  totalToman: number;
  selected: boolean;
  attachmentCount: number;
  requirementMatched: number;
  requirementTotal: number;
}

export interface CaseReportSnapshot {
  purchaseCase: PurchaseCase;
  rows: CaseReportQuoteRow[];
  selectedRow?: CaseReportQuoteRow;
  purchaseRow?: CaseReportQuoteRow;
  openReminders: CaseReminder[];
  providerCount: number;
  quoteCount: number;
  minTotal: number | null;
  maxTotal: number | null;
  spread: number | null;
}

function validTime(value: string) {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("fa-IR-u-nu-arabext", { maximumFractionDigits: 0 }).format(
    Math.round(value)
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian-nu-arabext", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function buildCaseReportSnapshot(
  purchaseCase: PurchaseCase,
  providers: Provider[],
  quotes: Quote[],
  reminders: CaseReminder[],
  attachments: Array<Pick<QuoteAttachment, "id" | "quoteId">>
): CaseReportSnapshot {
  const metrics = buildCaseMetrics(quotes);
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const attachmentCountByQuote = new Map<string, number>();

  for (const attachment of attachments) {
    attachmentCountByQuote.set(
      attachment.quoteId,
      (attachmentCountByQuote.get(attachment.quoteId) ?? 0) + 1
    );
  }

  function toRow(quote: Quote): CaseReportQuoteRow | null {
    const provider = providerById.get(quote.providerId);
    if (!provider) return null;
    const requirement = requirementMatchSummary(quote, purchaseCase.requirements);
    return {
      quote,
      provider,
      totalToman: quoteTotal(quote),
      selected: purchaseCase.selectedQuoteId === quote.id,
      attachmentCount: attachmentCountByQuote.get(quote.id) ?? 0,
      requirementMatched: requirement.matched,
      requirementTotal: requirement.total,
    };
  }

  const rows = metrics.latestQuotes
    .map(toRow)
    .filter((row): row is CaseReportQuoteRow => row !== null)
    .sort((a, b) => a.totalToman - b.totalToman);

  const selectedQuote = purchaseCase.selectedQuoteId
    ? quotes.find((quote) => quote.id === purchaseCase.selectedQuoteId)
    : undefined;
  const selectedRow = rows.find((row) => row.selected) ??
    (selectedQuote ? toRow(selectedQuote) ?? undefined : undefined);
  const purchaseQuote = purchaseCase.purchaseOutcome
    ? quotes.find((quote) => quote.id === purchaseCase.purchaseOutcome?.quoteId)
    : undefined;
  const purchaseRow = purchaseQuote ? toRow(purchaseQuote) ?? undefined : undefined;

  return {
    purchaseCase,
    rows,
    selectedRow,
    purchaseRow,
    openReminders: reminders
      .filter((reminder) => reminder.status === "open")
      .sort((a, b) => validTime(a.dueAt) - validTime(b.dueAt)),
    providerCount: metrics.providerCount,
    quoteCount: metrics.quoteCount,
    minTotal: metrics.minTotal,
    maxTotal: metrics.maxTotal,
    spread: metrics.spread,
  };
}

export function buildCaseReportText(snapshot: CaseReportSnapshot) {
  const { purchaseCase } = snapshot;
  const lines = [
    `گزارش بسنج — ${purchaseCase.title}`,
    `وضعیت: ${purchaseCase.status === "active" ? "فعال" : purchaseCase.status === "decided" ? "تصمیم‌گرفته" : "آرشیو"}`,
    `فروشنده: ${formatNumber(snapshot.providerCount)} · کل استعلام‌ها: ${formatNumber(snapshot.quoteCount)}`,
    `دسته‌بندی: ${categoryLabelForCase(purchaseCase)}`,
  ];

  if (purchaseCase.tags?.length) {
    lines.push(`برچسب‌ها: ${purchaseCase.tags.join("، ")}`);
  }

  if (purchaseCase.targetBudgetToman) {
    lines.push(`بودجه هدف: ${formatNumber(purchaseCase.targetBudgetToman)} تومان`);
  }
  if (purchaseCase.requirements?.length) {
    lines.push(
      `شرط‌های خرید: ${purchaseCase.requirements.map((item) => item.label).join("، ")}`
    );
  }

  lines.push("", "آخرین قیمت فروشنده‌ها:");
  if (!snapshot.rows.length) {
    lines.push("هنوز استعلامی ثبت نشده است.");
  } else {
    snapshot.rows.forEach((row, index) => {
      const parts = [
        `${formatNumber(index + 1)}. ${row.provider.name}`,
        `${formatNumber(row.totalToman)} تومان`,
        `تاریخ ${formatDate(row.quote.quotedAt)}`,
      ];
      if (row.quote.deliveryDays !== undefined) {
        parts.push(
          row.quote.deliveryDays === 0
            ? "تحویل فوری"
            : `تحویل ${formatNumber(row.quote.deliveryDays)} روز`
        );
      }
      if (row.requirementTotal) {
        parts.push(
          `${formatNumber(row.requirementMatched)} از ${formatNumber(row.requirementTotal)} شرط`
        );
      }
      if (row.selected) parts.push("انتخاب نهایی");
      lines.push(parts.join(" · "));
    });
  }

  if (snapshot.selectedRow) {
    lines.push(
      "",
      `انتخاب نهایی: ${snapshot.selectedRow.provider.name} — ${formatNumber(snapshot.selectedRow.totalToman)} تومان`
    );
  }

  if (purchaseCase.purchaseOutcome && snapshot.purchaseRow) {
    const outcome = purchaseCase.purchaseOutcome;
    lines.push(
      "",
      `نتیجه خرید: ${purchaseOutcomeStatusLabel(outcome.status)}`,
      `فروشنده خرید: ${snapshot.purchaseRow.provider.name}`,
      `مبلغ واقعی پرداخت‌شده: ${formatNumber(outcome.actualPaidToman)} تومان`,
      `تاریخ خرید: ${formatDate(outcome.purchasedAt)}`
    );
    if (outcome.orderReference) lines.push(`مرجع سفارش: ${outcome.orderReference}`);
    if (outcome.expectedDeliveryAt) lines.push(`تحویل مورد انتظار: ${formatDate(outcome.expectedDeliveryAt)}`);
    if (outcome.receivedAt) lines.push(`تاریخ دریافت: ${formatDate(outcome.receivedAt)}`);
    if (outcome.note) lines.push(`یادداشت نتیجه: ${outcome.note}`);
  }

  if (snapshot.openReminders.length) {
    lines.push("", `پیگیری باز: ${formatNumber(snapshot.openReminders.length)} مورد`);
  }

  lines.push("", "ساخته‌شده با بسنج");
  return lines.join("\n");
}

export function buildCaseTimeline(
  purchaseCase: PurchaseCase,
  providers: Provider[],
  quotes: Quote[],
  reminders: CaseReminder[],
  attachments: Array<Pick<QuoteAttachment, "id" | "quoteId" | "fileName" | "createdAt">>
): CaseTimelineItem[] {
  const providerById = new Map(providers.map((provider) => [provider.id, provider]));
  const quoteById = new Map(quotes.map((quote) => [quote.id, quote]));
  const items: CaseTimelineItem[] = [
    {
      id: `case-created:${purchaseCase.id}`,
      kind: "case",
      at: purchaseCase.createdAt,
      title: "پرونده ساخته شد",
      detail: purchaseCase.title,
    },
  ];

  for (const provider of providers) {
    items.push({
      id: `provider:${provider.id}`,
      kind: "provider",
      at: provider.createdAt,
      title: `فروشنده «${provider.name}» اضافه شد`,
      providerId: provider.id,
    });
  }

  for (const quote of quotes) {
    const provider = providerById.get(quote.providerId);
    items.push({
      id: `quote:${quote.id}`,
      kind: "quote",
      at: quote.createdAt || quote.quotedAt,
      title: provider
        ? `استعلام ${provider.name} ثبت شد`
        : "یک استعلام ثبت شد",
      detail: `${formatNumber(quoteTotal(quote))} تومان`,
      providerId: quote.providerId,
      quoteId: quote.id,
    });
  }

  for (const reminder of reminders) {
    const provider = reminder.providerId
      ? providerById.get(reminder.providerId)
      : undefined;
    items.push({
      id: `reminder-created:${reminder.id}`,
      kind: "reminder",
      at: reminder.createdAt,
      title: "پیگیری ثبت شد",
      detail: provider ? `${reminder.title} · ${provider.name}` : reminder.title,
      providerId: reminder.providerId,
      quoteId: reminder.quoteId,
    });
    if (reminder.completedAt) {
      items.push({
        id: `reminder-done:${reminder.id}`,
        kind: "reminder",
        at: reminder.completedAt,
        title: "پیگیری انجام شد",
        detail: reminder.title,
        providerId: reminder.providerId,
        quoteId: reminder.quoteId,
      });
    }
  }

  for (const attachment of attachments) {
    const quote = quoteById.get(attachment.quoteId);
    const provider = quote ? providerById.get(quote.providerId) : undefined;
    items.push({
      id: `attachment:${attachment.id}`,
      kind: "attachment",
      at: attachment.createdAt,
      title: `فایل «${attachment.fileName}» اضافه شد`,
      detail: provider ? `استعلام ${provider.name}` : undefined,
      providerId: quote?.providerId,
      quoteId: attachment.quoteId,
    });
  }

  if (purchaseCase.selectedQuoteId) {
    const quote = quoteById.get(purchaseCase.selectedQuoteId);
    const provider = quote ? providerById.get(quote.providerId) : undefined;
    items.push({
      id: `decision:${purchaseCase.id}:${purchaseCase.selectedQuoteId}`,
      kind: "decision",
      at: purchaseCase.updatedAt,
      title: "انتخاب نهایی فعلی ثبت شده",
      detail: provider
        ? `${provider.name}${quote ? ` · ${formatNumber(quoteTotal(quote))} تومان` : ""}`
        : undefined,
      providerId: quote?.providerId,
      quoteId: quote?.id,
    });
  } else if (purchaseCase.status === "archived") {
    items.push({
      id: `case-archived:${purchaseCase.id}`,
      kind: "case",
      at: purchaseCase.updatedAt,
      title: "پرونده در وضعیت آرشیو است",
    });
  }

  if (purchaseCase.purchaseOutcome) {
    const outcome = purchaseCase.purchaseOutcome;
    const quote = quoteById.get(outcome.quoteId);
    const provider = quote ? providerById.get(quote.providerId) : undefined;
    items.push({
      id: `purchase:${purchaseCase.id}:${outcome.quoteId}`,
      kind: "purchase",
      at: outcome.updatedAt,
      title:
        outcome.status === "received"
          ? "خرید نهایی دریافت شد"
          : "خرید نهایی ثبت شد",
      detail: `${provider ? `${provider.name} · ` : ""}${formatNumber(outcome.actualPaidToman)} تومان`,
      providerId: quote?.providerId,
      quoteId: quote?.id,
    });
  }

  return items.sort((a, b) => {
    const timeDiff = validTime(b.at) - validTime(a.at);
    return timeDiff !== 0 ? timeDiff : a.id.localeCompare(b.id);
  });
}
