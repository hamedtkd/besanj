# QA — Besanj 1.1.0

## فاز بینش خرید و حافظه فروشنده

- صفحه `/insights` برای تحلیل داده خرید واقعی
- هزینه، صرفه‌جویی، بودجه، سرعت تصمیم و تحویل به‌موقع
- نمودار هزینه ماهانه
- حافظه فروشنده بین پرونده‌ها با نرمال‌سازی شماره/نام
- `.gitattributes` برای LF پایدار روی Windows
- `check:insights` guard

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **84/84 PASS**
- `TZ=Asia/Tehran npm test`: **84/84 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- `check:purchase`: **PASS**
- `check:insights`: **PASS**

Dependencyهای کامل npm داخل sandbox نصب نشده‌اند؛ بنابراین `tsc --noEmit`، ESLint و Next production build کامل باید روی سیستم مقصد با `npm run check` اجرا شوند.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA — Besanj 1.0.0

## فاز بستن حلقه خرید

- ثبت مبلغ واقعی و وضعیت سفارش/دریافت
- تاریخ خرید، مرجع سفارش، تحویل مورد انتظار، تاریخ دریافت و یادداشت
- مقایسه پرداخت واقعی با استعلام، بودجه و گران‌ترین گزینه
- قفل انتخاب نهایی بعد از ثبت خرید
- نتیجه خرید در کارت پرونده، گزارش و Timeline
- Delivery task در کارهای امروز و اعلان محلی
- Backup validation برای purchase outcome
- `check:purchase` guard

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **80/80 PASS**
- `TZ=Asia/Tehran npm test`: **80/80 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- `check:purchase`: **PASS**
- TypeScript syntax/transpile scan: **119 فایل TS/TSX، 0 خطای syntax**
- Local import resolution: **444 import محلی، 0 مسیر شکسته**
- Unused import candidate scan: **0 مورد**
- JavaScript syntax check برای Service Worker و scriptهای `.mjs`: **PASS**

Dependencyهای کامل npm داخل sandbox نصب نشدند؛ بنابراین `tsc --noEmit`، ESLint و Next production build کامل باید روی سیستم مقصد با `npm run check` اجرا شوند.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA — Besanj 0.9.0

## فاز ثبت سریع و استفاده از سابقه

- paste-to-form quote capture
- Persian/Arabic/Latin digit normalization
- Toman/Rial amount parsing
- delivery / warranty / payment / validity / channel suggestions
- review-first flow; no automatic save
- cross-case provider reuse with normalized deduplication
- `check:capture` guard

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **72/72 PASS**
- `TZ=Asia/Tehran npm test`: **72/72 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- TypeScript syntax/transpile scan: **115 فایل TS/TSX، 0 خطای syntax**
- Local import resolution: **412 import محلی، 0 مسیر شکسته**
- JavaScript syntax check برای Service Worker و scriptهای `.mjs`: **PASS**

Dependencyهای کامل npm داخل sandbox موجود نیستند؛ بنابراین `tsc --noEmit`، ESLint و Next production build کامل را باید روی سیستم مقصد با `npm run check` اجرا کرد.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA — Besanj 0.8.0

## فاز اعلان و اقدام روزانه

- Web Notification permission/settings UI
- daily notification dedupe ledger
- service-worker notification click routing
- app badge + navbar task badge
- reminder snooze / done actions
- `check:automation` guard

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **67/67 PASS**
- `TZ=Asia/Tehran npm test`: **67/67 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- TypeScript syntax/transpile scan: **109 فایل TS/TSX، 0 خطای syntax**
- Local import resolution: **397 import محلی، 0 مسیر شکسته**
- Unused import candidate scan: **0 مورد**
- JavaScript syntax check برای Service Worker و scriptهای `.mjs`: **PASS**
- typecheck هدفمند برای `notifications/follow-up/quote/types`: **PASS**

Dependencyهای کامل npm داخل sandbox موجود نیستند؛ بنابراین `tsc --noEmit`، ESLint و Next production build کامل را باید روی سیستم مقصد با `npm run check` اجرا کرد.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

برای regression تاریخ نیز:

```bash
TZ=Asia/Tehran npm test
```

---

# QA — Besanj 0.7.0

## مبنای شروع

نسخه 0.6.0 روی سیستم مقصد گیت کامل `npm run check` را پاس کرده بود: doctor، UI/theme/PWA/workflow/data guards، TypeScript، ESLint، 54 تست و Next production build.

## تغییرات فاز 0.7

- Quick contact روی کارت استعلام: call / SMS / WhatsApp / copy follow-up text.
- متن پیگیری بر اساس پرونده، فروشنده، آخرین قیمت و اعتبار قیمت.
- Case timeline با فیلتر رویداد.
- مسیر گزارش مستقل `/cases/[id]/report`.
- خلاصه قابل کپی و Web Share.
- Print stylesheet A4 و Save as PDF از دیالوگ چاپ مرورگر.
- نگهداری انتخاب نهایی تاریخی در گزارش حتی وقتی quote تازه‌تری برای همان فروشنده وجود دارد.
- Guard جدید `check:report`.
- Service Worker cache version: `besanj-shell-v8`.

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **61/61 PASS**
- `TZ=Asia/Tehran npm test`: **61/61 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- JavaScript syntax check برای Service Worker و تمام scriptهای `.mjs`: **PASS**
- TypeScript syntax/transpile scan: **104 فایل TS/TSX، 0 خطای syntax**
- Local import resolution: **378 import محلی، 0 مسیر شکسته** (CSS import مستثنا)
- Unused-import candidate scan روی فایل‌های جدید/تغییریافته: **0 مورد**

## محدودیت محیط ساخت

Dependencyهای npm داخل این sandbox نصب نیستند. بنابراین `tsc --noEmit`، `eslint` و `next build` کامل اینجا گیت نهایی محسوب نمی‌شوند. اجرای مرجع باید روی سیستم مقصد انجام شود:

```bash
npm install
npm run check
```

## Smoke test پیشنهادی

1. یک پرونده با شماره موبایل فروشنده باز کن؛ روی کارت قیمت باید تماس، واتساپ، پیامک و کپی متن قابل استفاده باشند.
2. فروشنده شماره ثابت داشته باشد؛ تماس نمایش داده شود ولی SMS و WhatsApp نمایش داده نشوند.
3. تب «رویدادها» را باز کن و فیلترهای استعلام/پیگیری/فایل/تصمیم را تست کن.
4. روی «گزارش» بزن؛ صفحه گزارش باید بودجه، شروط، قیمت‌ها و انتخاب نهایی را نشان دهد.
5. «کپی خلاصه» را تست کن.
6. روی دستگاهی که Web Share دارد، «اشتراک» را تست کن؛ روی مرورگر بدون Web Share باید متن کپی شود.
7. «چاپ / ذخیره PDF» را بزن و Preview را در Light و Dark Mode بررسی کن؛ خروجی چاپ باید پس‌زمینه سفید و A4 باشد.
8. اگر انتخاب نهایی quote قدیمی است و همان فروشنده quote جدید دارد، بخش «انتخاب نهایی» باید همچنان quote انتخاب‌شده قبلی را نشان دهد.
