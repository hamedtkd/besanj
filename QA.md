# QA — Besanj 0.4.9

## تغییرات این نسخه

- پالت پیش‌فرض آبی-نیلی و cool-neutral برای Light/Dark.
- حفظ پالت‌های کهربایی، بنفش، رز و Custom.
- migration یک‌بارهٔ default legacy amber به blue.
- استفاده از لوگوی جدید در Navbar.
- favicon، SVG app icon، Apple Touch Icon، 192/512 و Maskable icon جدید.
- Web Manifest و Service Worker.
- Install Provider سراسری برای جلوگیری از از دست رفتن `beforeinstallprompt`.
- نصب مستقیم از Settings و راهنمای iOS.
- guard جدید `check:pwa`.

## نتیجهٔ بررسی‌های اجراشده در محیط ساخت

- `npm test`: **37/37 PASS**
- `npm run check:ui`: **PASS**
- `npm run check:theme`: **PASS**
- `npm run check:pwa`: **PASS**
- آیکن‌های PWA با ابعاد 192×192، 512×512، maskable 512×512 و Apple 180×180 تولید و بررسی شدند.
- TypeScript syntax/transpile scan: **80 فایل TS/TSX PASS**.
- local import resolution: **254 import محلی، 0 مسیر شکسته**.
- JavaScript syntax check برای Service Worker و scriptهای QA: **PASS**.

`npm install` در این محیط به registry متصل نشد و timeout شد؛ بنابراین `typecheck`، `lint` و `next build` کامل باید روی سیستم مقصد بعد از نصب dependencyها اجرا شوند.

## گیت کامل روی سیستم مقصد

```bash
npm install
npm run check
```

## Smoke test پیشنهادی

1. در Light Mode بررسی کن Primary دکمه‌ها `#2563EB` باشد و لوگوی جدید در Navbar دیده شود.
2. Dark Mode را فعال کن؛ Primary باید به آبی روشن تبدیل شود و borderها/سطوح cool-neutral باقی بمانند.
3. پالت کهربایی را انتخاب کن و refresh بزن؛ باید هنوز کار کند و ذخیره شود.
4. favicon مرورگر و icon نصب را بررسی کن.
5. برای تست PWA از production local استفاده کن: `npm run build && npm start`.
6. Settings > نصب روی دستگاه را باز کن؛ در Chrome/Edge دارای prompt باید دکمه نصب فعال باشد.
7. بعد از نصب، اپ باید در حالت standalone باز شود و Settings وضعیت «اپ نصب شده است» نشان دهد.
8. در Dev Mode، Service Worker نباید cache مزاحم ایجاد کند.
9. روی iOS متن راهنمای Safari > Share > Add to Home Screen نمایش داده شود.


## اصلاحات check در 0.4.8

- callbackهای Base UI Select اکنون `null` را قبل از ورود به state دامنه رد می‌کنند.
- narrowing داده async در `CaseScreen` برای callbackها پایدار شده است.
- فایل‌های legacy مربوط به `next-themes` و `react-day-picker` در overlayهای قدیمی با cleanup حذف می‌شوند.
- هشدار `scroll-behavior: smooth` در Next.js 16 با `data-scroll-behavior="smooth"` رفع شده است.


## اصلاحات lint در 0.4.8

- `AppPreferencesProvider`: بارگذاری state ذخیره‌شده دیگر به‌صورت synchronous داخل Effect انجام نمی‌شود؛ hydrate در callback فریم بعدی انجام می‌شود و callbackهای theme نیز پایدار شده‌اند.
- `CaseScreen`: پاک‌سازی shortlist دیگر Effect و setState ندارد؛ شناسه‌های معتبر از state کاربر و آخرین quoteها به‌صورت derived محاسبه می‌شوند.
- `CustomThemeColorSheet`: reset اولیهٔ editor داخل callback فریم انجام می‌شود و dependencyهای effect کامل و پایدار هستند.
- `PwaInstallProvider`: تشخیص standalone/iOS در callback فریم انجام می‌شود، در حالی که event subscriptionها همان لحظه ثبت می‌شوند.
- `QuoteFormDialog`: `form.watch()` با `useWatch()` جایگزین شد تا warning مربوط به React Compiler / incompatible-library حذف شود.
- `DatePicker`: Effect اضافه برای sync کردن draft حذف شد؛ هنگام باز شدن picker از value فعلی snapshot گرفته می‌شود.
- `postcss.config.mjs`: export ناشناس به config نام‌دار تبدیل شد.

## بررسی‌های 0.4.8 در محیط ساخت

- `npm test`: **37/37 PASS**
- UI policy script: **PASS**
- Theme/runtime guard: **PASS**
- PWA/brand guard: **PASS**
- TypeScript syntax/transpile scan: **80 فایل TS/TSX PASS**
- `form.watch()` در سورس محصول: **0 مورد**

به دلیل نبود dependencyهای npm در محیط ساخت، `eslint`, `tsc --noEmit` و `next build` کامل اینجا قابل اجرای نهایی نبودند. گیت مرجع همچنان `npm run check` روی سیستم مقصد است.


## اصلاح نهایی lint در 0.4.9

- `QuoteFormDialog` دیگر برای تشخیص «ثبت و بعدی» از `useRef` استفاده نمی‌کند.
- نوع submit از `SubmitEvent.submitter` و `value` خود دکمه submit خوانده می‌شود؛ بنابراین هیچ ref در مسیر render یا تابعی که به `handleSubmit` داده می‌شود خوانده نمی‌شود.
- هر دو دکمه submit اکنون semantic هستند و `name="submitMode"` با valueهای `next` و `close` دارند.
- رفتار Enter روی فرم به‌طور پیش‌فرض `close` باقی می‌ماند.
