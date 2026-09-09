import type { DashboardTask, DashboardTaskKind } from "./follow-up.ts";

export interface NotificationSettings {
  enabled: boolean;
  reminders: boolean;
  expiring: boolean;
  stale: boolean;
  ready: boolean;
  delivery: boolean;
  appBadge: boolean;
}

export type NotificationLedger = Record<string, string>;

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: false,
  reminders: true,
  expiring: true,
  stale: false,
  ready: false,
  delivery: true,
  appBadge: true,
};

const SETTING_KEY_BY_KIND: Record<DashboardTaskKind, keyof NotificationSettings> = {
  reminder: "reminders",
  expiring: "expiring",
  stale: "stale",
  ready: "ready",
  delivery: "delivery",
};

export function normalizeNotificationSettings(
  value: Partial<NotificationSettings> | null | undefined
): NotificationSettings {
  if (!value || typeof value !== "object") return { ...DEFAULT_NOTIFICATION_SETTINGS };

  return {
    enabled: value.enabled === true,
    reminders: value.reminders !== false,
    expiring: value.expiring !== false,
    stale: value.stale === true,
    ready: value.ready === true,
    delivery: value.delivery !== false,
    appBadge: value.appBadge !== false,
  };
}

export function notificationDayKey(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function taskNotificationsEnabled(
  task: DashboardTask,
  settings: NotificationSettings
) {
  return settings.enabled && Boolean(settings[SETTING_KEY_BY_KIND[task.kind]]);
}

export function selectUnnotifiedTasks(
  tasks: DashboardTask[],
  settings: NotificationSettings,
  ledger: NotificationLedger,
  now = new Date()
) {
  const dayKey = notificationDayKey(now);
  return tasks.filter(
    (task) => taskNotificationsEnabled(task, settings) && ledger[task.id] !== dayKey
  );
}

export function markTasksNotified(
  ledger: NotificationLedger,
  tasks: DashboardTask[],
  now = new Date()
): NotificationLedger {
  const dayKey = notificationDayKey(now);
  const next: NotificationLedger = {};
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 14);
  const cutoffKey = notificationDayKey(cutoff);

  for (const [taskId, notifiedOn] of Object.entries(ledger)) {
    if (typeof notifiedOn === "string" && notifiedOn >= cutoffKey) {
      next[taskId] = notifiedOn;
    }
  }
  for (const task of tasks) next[task.id] = dayKey;
  return next;
}

export interface BesanjNotificationPayload {
  title: string;
  body: string;
  url: string;
  tag: string;
}

export function buildNotificationPayload(
  tasks: DashboardTask[],
  now = new Date()
): BesanjNotificationPayload | null {
  if (!tasks.length) return null;
  const dayKey = notificationDayKey(now);

  if (tasks.length === 1) {
    const task = tasks[0]!;
    return {
      title: task.title,
      body: task.detail,
      url: `/cases/${task.caseId}`,
      tag: `besanj-task-${dayKey}-${task.id}`,
    };
  }

  const firstTitles = tasks
    .slice(0, 2)
    .map((task) => task.title)
    .join(" · ");
  const remaining = tasks.length - 2;
  return {
    title: `${tasks.length.toLocaleString("fa-IR-u-nu-arabext")} کار در بسنج نیاز به توجه دارد`,
    body: remaining > 0 ? `${firstTitles} · و ${remaining.toLocaleString("fa-IR-u-nu-arabext")} مورد دیگر` : firstTitles,
    url: "/",
    tag: `besanj-daily-${dayKey}`,
  };
}
