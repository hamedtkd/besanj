# بسنج — Besanj

دفتر شخصی استعلام قیمت برای ثبت قیمت‌های چند فروشنده یا ارائه‌دهنده، نگه‌داشتن تاریخچه و مقایسهٔ گزینه‌ها قبل از تصمیم نهایی.

نسخه: **0.4.9**

## قابلیت‌های فعلی

- پرونده جدا برای هر خرید یا خدمت.
- ثبت چند استعلام با فروشنده، قیمت، هزینه جانبی، تاریخ، اعتبار قیمت، تحویل، گارانتی، پرداخت، کانال تماس و یادداشت.
- کانال‌های تلفن، واتساپ، اینستاگرام، تلگرام، حضوری، وب، پیامک، ایمیل، بله، ایتا، روبیکا، دیوار، شیپور و سایر.
- تاریخچهٔ کامل هر فروشنده و استعلام مجدد بدون overwrite قیمت قبلی.
- انتخاب تا ۴ گزینه برای مقایسهٔ کنار هم.
- تب مقایسه، نمودار قیمت، تاریخچه، تصمیم‌یار و جزئیات.
- Bar chart برای آخرین قیمت‌ها و Timeline/Scatter برای روند همهٔ استعلام‌ها.
- فیلترهای فروشنده، کانال، تازگی، قیمت، تحویل، گارانتی و بازهٔ تاریخ.
- تصمیم‌یار با اولویت قیمت، زمان تحویل، تازگی، گارانتی یا حالت متعادل.
- انتخاب و لغو شفاف گزینهٔ نهایی.
- Light / Dark / System با **آبی برند به‌عنوان رنگ پیش‌فرض** + سه پالت جایگزین و رنگ سفارشی.
- تغییر سریع Light/Dark و پالت از Navbar، با runtime داخلی بدون hydration mismatch.
- Dashboard با جست‌وجو، فیلتر نوع/پیگیری و چند حالت مرتب‌سازی.
- لوگوی رسمی Besanj در Navbar، favicon، Apple Touch Icon و آیکن‌های نصب.
- PWA قابل نصب با Web Manifest، Service Worker، آیکن maskable و نصب مستقیم از تنظیمات.
- local-first با Dexie؛ بدون Login و Backend.

## رابط فارسی

- `lang="fa"` و `dir="rtl"` از root.
- فونت Mikhak.
- ارقام نمایشی فارسی.
- PriceInput با گروه‌بندی زنده و فقط `TomanIcon` به‌عنوان واحد دیداری.
- شماره موبایل و ورودی عدد صحیح با ارقام فارسی.
- Selectهای PersianLabs با `items` map؛ value داخلی یا UUID در Trigger نمایش داده نمی‌شود.
- DatePicker جلالی با موتور Doran و bridge کامل به tokenهای Light/Dark/Custom Theme.
- Popover در دسکتاپ و Bottom Sheet قابل drag-to-dismiss در موبایل.
- انتخاب سریع اعتبار قیمت: همان روز، ۳ روز، ۱ هفته، ۲ هفته و ۱ ماه.

## تقویم Doran

DatePicker نسخه 0.4 از موتور Doran استفاده می‌کند و UI را با primitiveهای خود پروژه می‌سازد. این معماری مطابق راهنمای shadcn خود Doran است.

Dependencyها:

```text
@doranjs/core
@doranjs/react
@doranjs/ui
```

## تم سفارشی

تنظیمات ظاهر شامل:

- سیستم
- روشن
- تاریک
- آبی برند (پیش‌فرض)
- بنفش
- کهربایی
- رز
- رنگ سفارشی با Hue / Saturation / Value و Hex
- ذخیره حداکثر ۸ رنگ روی همین مرورگر

رنگ سفارشی روی Primary، Ring، نمودارها و Glass border اعمال می‌شود و در حالت تاریک نیز دوباره محاسبه می‌شود.

## داده و Migration

Database:

```text
estelamkoo-local
```

Schema version:

```text
3
```

Migration نسخه 3 داده‌های نسخه‌های قبلی را حفظ می‌کند و فقط مقادیر optional ناسالم را پاک‌سازی می‌کند. رشته‌هایی مثل `null`، `undefined` و `NaN` دیگر در UI نمایش داده نمی‌شوند.

Tableها:

```text
purchaseCases
providers
quotes
```

## نصب

Node نسخهٔ پیشنهادی در `.nvmrc` ثبت شده است.

```bash
npm install
npm run dev
```

## کنترل کیفیت

گیت کامل:

```bash
npm run check
```

این دستور به ترتیب doctor، UI policy، Theme guard، PWA/brand guard، TypeScript، ESLint، تست‌ها و production build را اجرا می‌کند:

```text
doctor
check:ui
check:theme
check:pwa
typecheck
lint
test
build
```

تست‌های مستقل از dependency با:

```bash
npm test
```

و سیاست UI با:

```bash
npm run check:ui
```

## نصب به‌عنوان اپ (PWA)

نسخه 0.4.9 دارای `manifest.webmanifest`، Service Worker و آیکن‌های 192/512/Maskable است. Service Worker عمداً فقط در production ثبت می‌شود تا در `next dev` فایل‌های قدیمی cache نشوند.

برای تست واقعی نصب روی localhost:

```bash
npm run build
npm start
```

سپس `http://localhost:3000` را باز کن. در Chrome/Edge در صورت فراهم بودن شرایط، دکمه «نصب بسنج» در تنظیمات فعال می‌شود. روی iPhone/iPad از Safari > Share > Add to Home Screen استفاده می‌شود. در انتشار عمومی، PWA باید روی HTTPS باشد.

## ساختار مهم

```text
app/
components/
  ui/
lib/
tests/
docs/
scripts/
```

فایل‌های مهم:

```text
components/ui/date-picker.tsx
components/ui/responsive-sheet.tsx
components/ui/price-input.tsx
components/ui/integer-input.tsx
components/app-theme.tsx
components/app-preferences.tsx
components/custom-theme-color-sheet.tsx
components/pwa-register.tsx
components/pwa-install-provider.tsx
components/pwa-install-section.tsx
components/quote-comparison.tsx
components/decision-assistant.tsx
lib/db.ts
lib/theme-color.ts
lib/validation-rules.ts
```

## قانون UI

برای کنترل‌های عمومی ابتدا PersianLabs/ui بررسی می‌شود. کنترل native مرورگر در product layer جایگزین قابل قبول نیست مگر در یک primitive تخصصی و با دلیل مشخص.

DatePicker استثنای مستند است: موتور تقویم Doran است، اما Button / Popover / Bottom Sheet و ظاهر آن متعلق به همین پروژه است.

`npm run check:ui` جلوی بازگشت موارد زیر را می‌گیرد:

- native `<select>`
- `input[type=date]`
- checkbox native
- raw Button/Input/Textarea در product layer
- PriceInput بدون InputGroup
- Select بدون `items` map

## انتشار

بعد از سبز بودن `npm run check`:

```bash
git init
git add .
git commit -m "fix: remove render-time ref access in Besanj v0.4.9"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO>
git push -u origin main
```

برای Vercel، پروژه Next.js بدون Backend قابل Deploy است. داده‌ها در مرورگر کاربر می‌مانند.

## منابع

جزئیات کدهای اقتباسی و کتابخانه‌ها در `THIRD_PARTY.md` ثبت شده است. تغییرات نسخه 0.4.9 در `docs/RELEASE_0.4.9.md` و چک‌لیست QA در `QA.md` آمده است.
