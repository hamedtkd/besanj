"use client";

import * as React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";
import { buildDashboardTasks, type DashboardTask } from "@/lib/follow-up";
import {
  buildNotificationPayload,
  DEFAULT_NOTIFICATION_SETTINGS,
  markTasksNotified,
  normalizeNotificationSettings,
  selectUnnotifiedTasks,
  type NotificationLedger,
  type NotificationSettings,
} from "@/lib/notifications";

const SETTINGS_STORAGE_KEY = "besanj:notifications:v1";
const LEDGER_STORAGE_KEY = "besanj:notification-ledger:v1";

type PermissionState = NotificationPermission | "unsupported";
type EnableOutcome = "enabled" | "denied" | "unsupported";

type BadgingNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

interface NotificationContextValue {
  supported: boolean;
  permission: PermissionState;
  settings: NotificationSettings;
  tasks: DashboardTask[];
  enable: () => Promise<EnableOutcome>;
  disable: () => void;
  setKindEnabled: (
    kind: "reminders" | "expiring" | "delivery" | "stale" | "ready" | "appBadge",
    enabled: boolean
  ) => void;
  sendTest: () => Promise<boolean>;
}

const NotificationContext = React.createContext<NotificationContextValue | null>(null);

function readStoredSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_NOTIFICATION_SETTINGS };
    return normalizeNotificationSettings(JSON.parse(raw) as Partial<NotificationSettings>);
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

function storeSettings(settings: NotificationSettings) {
  try {
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Preference persistence is best effort; notifications can still work for this session.
  }
}

function readLedger(): NotificationLedger {
  try {
    const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as NotificationLedger) : {};
  } catch {
    return {};
  }
}

function writeLedger(ledger: NotificationLedger) {
  try {
    window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(ledger));
  } catch {
    // The next foreground check may notify again if storage is unavailable.
  }
}

async function showSystemNotification(
  title: string,
  options: NotificationOptions
): Promise<boolean> {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration("/");
    if (registration) {
      await registration.showNotification(title, options);
      return true;
    }
  }

  try {
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      const url = (options.data as { url?: string } | undefined)?.url;
      if (url) window.location.assign(url);
      notification.close();
    };
    return true;
  } catch {
    return false;
  }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [permission, setPermission] = React.useState<PermissionState>("unsupported");
  const [settings, setSettings] = React.useState<NotificationSettings>(
    DEFAULT_NOTIFICATION_SETTINGS
  );

  const data = useLiveQuery(async () => {
    const [cases, quotes, reminders] = await Promise.all([
      db.purchaseCases.toArray(),
      db.quotes.toArray(),
      db.reminders.toArray(),
    ]);
    return { cases, quotes, reminders };
  }, []);

  const tasks = React.useMemo(
    () =>
      data
        ? buildDashboardTasks(data.cases, data.quotes, data.reminders)
        : [],
    [data]
  );

  React.useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setPermission("Notification" in window ? Notification.permission : "unsupported");
      setSettings(readStoredSettings());
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const updateBadge = React.useCallback(
    async (nextTasks: DashboardTask[], nextSettings = settings) => {
      const badgeNavigator = navigator as BadgingNavigator;
      if (!nextSettings.enabled || !nextSettings.appBadge) {
        await badgeNavigator.clearAppBadge?.().catch(() => undefined);
        return;
      }
      if (nextTasks.length > 0) {
        await badgeNavigator.setAppBadge?.(nextTasks.length).catch(() => undefined);
      } else {
        await badgeNavigator.clearAppBadge?.().catch(() => undefined);
      }
    },
    [settings]
  );

  const flushNotifications = React.useCallback(async () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (!settings.enabled) return;

    const now = new Date();
    const ledger = readLedger();
    const unseen = selectUnnotifiedTasks(tasks, settings, ledger, now);
    if (!unseen.length) return;

    const payload = buildNotificationPayload(unseen, now);
    if (!payload) return;
    const shown = await showSystemNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag,
      data: { url: payload.url },
    });
    if (shown) writeLedger(markTasksNotified(ledger, unseen, now));
  }, [settings, tasks]);

  React.useEffect(() => {
    void updateBadge(tasks);
    void flushNotifications();
  }, [flushNotifications, tasks, updateBadge]);

  React.useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      if ("Notification" in window) setPermission(Notification.permission);
      void updateBadge(tasks);
      void flushNotifications();
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void flushNotifications();
    }, 15 * 60 * 1000);

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [flushNotifications, tasks, updateBadge]);

  const enable = React.useCallback(async (): Promise<EnableOutcome> => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return "unsupported";
    }

    let nextPermission = Notification.permission;
    if (nextPermission === "default") nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);
    if (nextPermission !== "granted") return "denied";

    const next = { ...settings, enabled: true };
    setSettings(next);
    storeSettings(next);
    window.setTimeout(() => void updateBadge(tasks, next), 0);
    return "enabled";
  }, [settings, tasks, updateBadge]);

  const disable = React.useCallback(() => {
    const next = { ...settings, enabled: false };
    setSettings(next);
    storeSettings(next);
    const badgeNavigator = navigator as BadgingNavigator;
    void badgeNavigator.clearAppBadge?.().catch(() => undefined);
  }, [settings]);

  const setKindEnabled = React.useCallback(
    (
      kind: "reminders" | "expiring" | "delivery" | "stale" | "ready" | "appBadge",
      enabled: boolean
    ) => {
      const next = { ...settings, [kind]: enabled };
      setSettings(next);
      storeSettings(next);
      if (kind === "appBadge") void updateBadge(tasks, next);
    },
    [settings, tasks, updateBadge]
  );

  const sendTest = React.useCallback(async () => {
    if (!("Notification" in window) || Notification.permission !== "granted") return false;
    return showSystemNotification("اعلان‌های بسنج فعال‌اند", {
      body: "از این به بعد پیگیری‌ها و قیمت‌های رو به انقضا را هنگام باز بودن یا برگشتن به بسنج یادآوری می‌کنیم.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: "besanj-notification-test",
      data: { url: "/" },
    });
  }, []);

  const value = React.useMemo<NotificationContextValue>(
    () => ({
      supported: permission !== "unsupported",
      permission,
      settings,
      tasks,
      enable,
      disable,
      setKindEnabled,
      sendTest,
    }),
    [disable, enable, permission, sendTest, setKindEnabled, settings, tasks]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const value = React.useContext(NotificationContext);
  if (!value) throw new Error("useNotifications must be used inside NotificationProvider.");
  return value;
}
