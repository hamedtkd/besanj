import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { Providers } from "@/components/providers";
import {
  normalizeThemeMode,
  THEME_COOKIE_NAME,
  type ThemeMode,
} from "@/lib/theme";

export const metadata: Metadata = {
  title: {
    default: "بسنج",
    template: "%s | بسنج",
  },
  description:
    "بسنج؛ دفتر شخصی استعلام قیمت برای مقایسه چند فروشنده یا ارائه‌دهنده در طول زمان.",
  applicationName: "بسنج",
  category: "shopping",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "بسنج",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const initialTheme: ThemeMode =
    normalizeThemeMode(cookieStore.get(THEME_COOKIE_NAME)?.value) ?? "system";
  const initialResolved =
    initialTheme === "dark" ? "dark" : initialTheme === "light" ? "light" : undefined;

  return (
    <html
      lang="fa"
      dir="rtl"
      className={initialResolved}
      style={initialResolved ? { colorScheme: initialResolved } : undefined}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <body className="mesh-bg">
        <Providers initialTheme={initialTheme}>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
