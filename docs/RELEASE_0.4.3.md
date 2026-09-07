# Besanj 0.4.3

## رفع Hydration و Theme runtime

- `next-themes` حذف شد. در React 19 / Next.js 16 مسیر inline script آن می‌توانست هشدار `Encountered a script tag while rendering React component` ایجاد کند.
- Theme runtime داخلی با `useSyncExternalStore` اضافه شد تا snapshot اولیهٔ SSR و hydration یکسان بماند.
- انتخاب تم همچنان با کلید قبلی `theme` در localStorage سازگار است تا تنظیم موجود کاربر از بین نرود.
- تم در cookie نیز mirror می‌شود تا SSR در refreshهای بعدی Light/Dark صریح را از ابتدا درست رندر کند.
- دکمهٔ سریع Light/Dark دیگر icon یا aria-label متفاوت در SSR/Client تولید نمی‌کند؛ هر دو آیکن در markup ثابت هستند و CSS فقط آیکن مناسب را نمایش می‌دهد.
- guard جدید `npm run check:theme` جلوی بازگشت `next-themes` و client-side raw script را می‌گیرد.

## رفع Sheet رنگ سفارشی

- `ResponsiveSheet` اکنون با React Portal مستقیماً روی `document.body` رندر می‌شود؛ بنابراین Navbar، sticky header، backdrop-filter یا containing block دیگر نمی‌تواند مودال را ببرد بالا یا clip کند.
- Portal تا پایان hydration ایجاد نمی‌شود تا خودش hydration mismatch تازه ایجاد نکند.
- scroll داخلی Sheet هنگام هر بار بازشدن از ابتدای محتوا شروع می‌شود.
- Custom color sheet در دسکتاپ compactتر شده و ارتفاع saturation panel کمتر شده است.
- بازکردن رنگ سفارشی از quick-theme menu یک frame بعد از بسته‌شدن popover انجام می‌شود تا focus restore و overlayها با هم تداخل نداشته باشند.

## تست و Guard

- تست normalize شدن ThemeMode اضافه شد.
- Theme/runtime guard اضافه شد.
