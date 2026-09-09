import { buildCaseMetrics, getQuoteFreshness } from "./quote.ts";
import type { CaseReminder, PurchaseCase, Quote } from "./types.ts";

export type DashboardTaskKind =
  | "reminder"
  | "expiring"
  | "stale"
  | "ready"
  | "delivery";

export type DashboardTaskPriority = "urgent" | "soon" | "normal";

export interface DashboardTask {
  id: string;
  caseId: string;
  reminderId?: string;
  kind: DashboardTaskKind;
  priority: DashboardTaskPriority;
  title: string;
  detail: string;
  dueAt?: string;
}

const DAY_MS = 86_400_000;

export function snoozeReminderDueAt(days: number, now = new Date()) {
  const amount = Math.max(1, Math.round(days));
  const next = new Date(now);
  next.setHours(12, 0, 0, 0);
  next.setDate(next.getDate() + amount);
  const year = next.getFullYear();
  const month = String(next.getMonth() + 1).padStart(2, "0");
  const day = String(next.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}T23:59:59.999`;
}

function localDayNumber(value: Date) {
  return Math.floor(
    Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / DAY_MS
  );
}

function storedCalendarDayNumber(value: string) {
  // dueAt / validUntil are calendar-day fields. They are persisted as ISO strings,
  // but their time/offset must not move the user's chosen day when the runtime
  // timezone changes (for example 23:59Z becoming the next day in Asia/Tehran).
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return Number.POSITIVE_INFINITY;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = new Date(Date.UTC(year, month - 1, day));

  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.floor(utc.getTime() / DAY_MS);
}

function dayDiff(value: string, now: Date) {
  const targetDay = storedCalendarDayNumber(value);
  if (!Number.isFinite(targetDay)) return Number.POSITIVE_INFINITY;
  return targetDay - localDayNumber(now);
}

export function buildDashboardTasks(
  cases: PurchaseCase[],
  quotes: Quote[],
  reminders: CaseReminder[],
  now = new Date()
): DashboardTask[] {
  const activeCases = cases.filter((item) => item.status === "active");
  const activeById = new Map(activeCases.map((item) => [item.id, item]));
  const quoteMap = new Map<string, Quote[]>();

  for (const quote of quotes) {
    const rows = quoteMap.get(quote.caseId) ?? [];
    rows.push(quote);
    quoteMap.set(quote.caseId, rows);
  }

  const tasks: DashboardTask[] = [];

  for (const reminder of reminders) {
    if (reminder.status !== "open" || !activeById.has(reminder.caseId)) continue;
    const diff = dayDiff(reminder.dueAt, now);
    if (diff > 1) continue;
    const purchaseCase = activeById.get(reminder.caseId)!;
    tasks.push({
      id: `reminder:${reminder.id}`,
      caseId: reminder.caseId,
      reminderId: reminder.id,
      kind: "reminder",
      priority: diff < 0 ? "urgent" : diff === 0 ? "urgent" : "soon",
      title: reminder.title,
      detail:
        diff < 0
          ? `${purchaseCase.title} · از موعد گذشته`
          : diff === 0
            ? `${purchaseCase.title} · امروز`
            : `${purchaseCase.title} · فردا`,
      dueAt: reminder.dueAt,
    });
  }

  for (const purchaseCase of cases) {
    if (purchaseCase.status === "archived") continue;
    const outcome = purchaseCase.purchaseOutcome;
    if (!outcome || outcome.status !== "ordered" || !outcome.expectedDeliveryAt) continue;
    const diff = dayDiff(outcome.expectedDeliveryAt, now);
    if (diff > 1) continue;
    tasks.push({
      id: `delivery:${purchaseCase.id}:${outcome.quoteId}`,
      caseId: purchaseCase.id,
      kind: "delivery",
      priority: diff <= 0 ? "urgent" : "soon",
      title:
        diff < 0
          ? "تحویل این خرید از موعد گذشته"
          : diff === 0
            ? "موعد تحویل این خرید امروز است"
            : "موعد تحویل این خرید فرداست",
      detail: purchaseCase.title,
      dueAt: outcome.expectedDeliveryAt,
    });
  }

  for (const purchaseCase of activeCases) {
    const caseQuotes = quoteMap.get(purchaseCase.id) ?? [];
    const metrics = buildCaseMetrics(caseQuotes);
    if (!metrics.latestQuotes.length) continue;

    const expiring = metrics.latestQuotes
      .filter((quote) => quote.validUntil)
      .map((quote) => ({ quote, diff: dayDiff(quote.validUntil!, now) }))
      .filter(({ diff }) => diff >= 0 && diff <= 1)
      .sort((a, b) => a.diff - b.diff)[0];

    if (expiring) {
      tasks.push({
        id: `expiring:${purchaseCase.id}:${expiring.quote.id}`,
        caseId: purchaseCase.id,
        kind: "expiring",
        priority: expiring.diff === 0 ? "urgent" : "soon",
        title: expiring.diff === 0 ? "اعتبار یک قیمت امروز تمام می‌شود" : "اعتبار یک قیمت فردا تمام می‌شود",
        detail: purchaseCase.title,
        dueAt: expiring.quote.validUntil,
      });
    }

    const hasStale = metrics.latestQuotes.some((quote) => {
      const freshness = getQuoteFreshness(quote, now);
      return freshness === "stale" || freshness === "expired";
    });
    if (hasStale) {
      tasks.push({
        id: `stale:${purchaseCase.id}`,
        caseId: purchaseCase.id,
        kind: "stale",
        priority: "soon",
        title: "قیمت‌های این پرونده نیاز به تازه‌سازی دارند",
        detail: purchaseCase.title,
      });
    }

    if (!purchaseCase.selectedQuoteId && metrics.latestQuotes.length >= 2 && !hasStale) {
      tasks.push({
        id: `ready:${purchaseCase.id}`,
        caseId: purchaseCase.id,
        kind: "ready",
        priority: "normal",
        title: "این پرونده آماده تصمیم‌گیری است",
        detail: `${purchaseCase.title} · ${metrics.latestQuotes.length.toLocaleString("fa-IR-u-nu-arabext")} گزینه تازه`,
      });
    }
  }

  const priorityRank: Record<DashboardTaskPriority, number> = {
    urgent: 0,
    soon: 1,
    normal: 2,
  };

  return tasks.sort((a, b) => {
    const priority = priorityRank[a.priority] - priorityRank[b.priority];
    if (priority !== 0) return priority;
    const aTime = a.dueAt ? new Date(a.dueAt).getTime() : Number.POSITIVE_INFINITY;
    const bTime = b.dueAt ? new Date(b.dueAt).getTime() : Number.POSITIVE_INFINITY;
    return aTime - bTime;
  });
}
