import test from "node:test";
import assert from "node:assert/strict";
import {
  buildNotificationPayload,
  DEFAULT_NOTIFICATION_SETTINGS,
  markTasksNotified,
  normalizeNotificationSettings,
  notificationDayKey,
  selectUnnotifiedTasks,
} from "../lib/notifications.ts";
import { snoozeReminderDueAt, type DashboardTask } from "../lib/follow-up.ts";

const reminderTask: DashboardTask = {
  id: "reminder:r1",
  caseId: "case-1",
  reminderId: "r1",
  kind: "reminder",
  priority: "urgent",
  title: "تماس دوباره",
  detail: "لپ‌تاپ · امروز",
  dueAt: "2026-09-08T23:59:59.999",
};

const staleTask: DashboardTask = {
  id: "stale:case-1",
  caseId: "case-1",
  kind: "stale",
  priority: "soon",
  title: "قیمت‌های این پرونده نیاز به تازه‌سازی دارند",
  detail: "لپ‌تاپ",
};

test("notification defaults stay quiet for stale and ready tasks", () => {
  const settings = normalizeNotificationSettings(undefined);
  assert.equal(settings.reminders, true);
  assert.equal(settings.expiring, true);
  assert.equal(settings.stale, false);
  assert.equal(settings.ready, false);
  assert.equal(settings.enabled, false);
});

test("notification selection respects kind preferences and daily ledger", () => {
  const now = new Date(2026, 8, 8, 10, 0, 0);
  const settings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    enabled: true,
  };
  const first = selectUnnotifiedTasks([reminderTask, staleTask], settings, {}, now);
  assert.deepEqual(first.map((task) => task.id), [reminderTask.id]);

  const ledger = markTasksNotified({}, first, now);
  const second = selectUnnotifiedTasks([reminderTask], settings, ledger, now);
  assert.equal(second.length, 0);

  const tomorrow = new Date(2026, 8, 9, 10, 0, 0);
  const third = selectUnnotifiedTasks([reminderTask], settings, ledger, tomorrow);
  assert.equal(third.length, 1);
});

test("notification summary points a single task to its case", () => {
  const payload = buildNotificationPayload([reminderTask], new Date(2026, 8, 8, 10));
  assert.ok(payload);
  assert.equal(payload.url, "/cases/case-1");
  assert.equal(payload.title, "تماس دوباره");
});

test("notification summary aggregates multiple tasks on dashboard", () => {
  const payload = buildNotificationPayload(
    [reminderTask, { ...staleTask, id: "stale:case-2", caseId: "case-2" }],
    new Date(2026, 8, 8, 10)
  );
  assert.ok(payload);
  assert.equal(payload.url, "/");
  assert.match(payload.title, /۲/);
});

test("notification day key follows the local calendar day", () => {
  const value = new Date(2026, 8, 8, 23, 30, 0);
  assert.equal(notificationDayKey(value), "2026-09-08");
});

test("snooze uses tomorrow from now instead of the old overdue date", () => {
  const now = new Date(2026, 8, 8, 10, 0, 0);
  assert.equal(snoozeReminderDueAt(1, now).slice(0, 10), "2026-09-09");
  assert.equal(snoozeReminderDueAt(7, now).slice(0, 10), "2026-09-15");
});
