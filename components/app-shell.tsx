"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChartNoAxesCombined, Home, Settings } from "lucide-react";
import { BrandMark } from "@/components/brand-mark";
import { SettingsSheet } from "@/components/settings-sheet";
import { ThemeQuickActions } from "@/components/theme-quick-actions";
import { TaskQuickLink } from "@/components/task-quick-link";
import { Button } from "@/components/ui/button";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [settingsOpen, setSettingsOpen] = React.useState(false);

  return (
    <div className="min-h-svh">
      <a href="#app-main" className="skip-link">
        رفتن به محتوای اصلی
      </a>

      <header className="sticky top-0 z-40 border-b border-border/90 bg-background/82 shadow-[0_1px_0_color-mix(in_oklab,var(--foreground)_3%,transparent)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-3 sm:px-5 lg:px-7">
          <div className="flex min-w-0 items-center gap-2.5">
            {!isHome ? (
              <Button
                nativeButton={false}
                render={<Link href="/" />}
                variant="ghost"
                size="icon-sm"
                aria-label="بازگشت به پرونده‌ها"
              >
                <ArrowRight />
              </Button>
            ) : (
              <BrandMark />
            )}
            <div className="min-w-0">
              <Link href="/" className="type-brand block truncate">
                بسنج
              </Link>
              <p className="type-caption hidden text-muted-foreground sm:block">
                قیمت‌ها را فراموش نکن؛ تصمیم را مقایسه کن.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-0.5 rounded-xl border border-border/70 bg-background/55 p-1 shadow-sm">
            {!isHome ? (
              <Button
                nativeButton={false}
                render={<Link href="/" />}
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Home />
                پرونده‌ها
              </Button>
            ) : null}

            <Button
              nativeButton={false}
              render={<Link href="/insights" />}
              variant={pathname === "/insights" ? "secondary" : "ghost"}
              size="icon-sm"
              aria-label="بینش‌های خرید"
              title="بینش‌های خرید"
            >
              <ChartNoAxesCombined />
            </Button>

            <TaskQuickLink />
            <ThemeQuickActions onOpenSettings={() => setSettingsOpen(true)} />

            <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="تنظیمات"
              title="تنظیمات"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings />
            </Button>
          </div>
        </div>
      </header>

      <main
        id="app-main"
        className="mx-auto w-full max-w-6xl px-3 pt-5 pb-24 sm:px-5 sm:py-7 lg:px-7 lg:py-8"
      >
        {children}
      </main>

      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
