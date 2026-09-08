"use client";

import { AppPreferencesProvider } from "@/components/app-preferences";
import { AppThemeProvider } from "@/components/app-theme";
import { ToastProvider } from "@/components/toast";
import { PwaRegister } from "@/components/pwa-register";
import { PwaInstallProvider } from "@/components/pwa-install-provider";
import { NotificationProvider } from "@/components/notification-provider";
import type { ThemeMode } from "@/lib/theme";

export function Providers({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme: ThemeMode;
}) {
  return (
    <AppThemeProvider initialTheme={initialTheme}>
      <AppPreferencesProvider>
        <PwaInstallProvider>
          <NotificationProvider>
            <ToastProvider>
              <PwaRegister />
              {children}
            </ToastProvider>
          </NotificationProvider>
        </PwaInstallProvider>
      </AppPreferencesProvider>
    </AppThemeProvider>
  );
}
