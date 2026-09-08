# بسنج — Besanj

بسنج یک دفتر شخصی و local-first برای استعلام قیمت، پیگیری فروشنده‌ها، مقایسه گزینه‌ها و رسیدن به تصمیم خرید است.

نسخه: **0.5.1**

## فاز 0.5 — از «ثبت قیمت» تا «پیگیری خرید»

این نسخه بسنج را از یک دفتر مقایسه قیمت به یک فضای کاری کوچک برای پیگیری خرید تبدیل می‌کند:

- بودجه هدف برای هر پرونده و نمایش وضعیت هر پیشنهاد نسبت به بودجه.
- شروط و معیارهای خرید برای هر پرونده، مثل برند، مدل، گارانتی، رنگ یا زمان تحویل.
- ثبت پوشش شروط روی هر استعلام و استفاده از آن در مقایسه و تصمیم‌یار.
- امتیاز اعتماد فروشنده از ۱ تا ۵ همراه با یادداشت تجربه.
- یادآوری پیگیری برای پرونده/فروشنده با تاریخ سررسید.
- بخش «کارهای امروز» در داشبورد برای یادآوری‌ها، قیمت‌های رو به انقضا، پرونده‌های قدیمی و پرونده‌های آماده تصمیم.
- پیوست عکس، PDF و فایل به استعلام‌ها؛ فایل‌ها داخل IndexedDB همان مرورگر ذخیره می‌شوند.
- دکمه پیگیری سریع از کارت استعلام.
- تصمیم‌یار به بودجه پرونده، میزان پوشش شروط و امتیاز فروشنده توجه می‌کند.

## قابلیت‌های پایه

- پرونده جدا برای هر خرید یا خدمت.
- ثبت چند استعلام با فروشنده، قیمت، هزینه جانبی، تاریخ، اعتبار قیمت، تحویل، گارانتی، پرداخت، کانال تماس و یادداشت.
- تاریخچه کامل هر فروشنده و استعلام مجدد بدون overwrite قیمت قبلی.
- انتخاب تا ۴ گزینه برای مقایسه کنار هم.
- تب مقایسه، نمودار قیمت، تاریخچه، تصمیم‌یار و جزئیات.
- فیلترهای فروشنده، کانال، تازگی، قیمت، تحویل، گارانتی و بازه تاریخ.
- انتخاب و لغو شفاف گزینه نهایی.
- Dashboard با جست‌وجو، فیلتر نوع/پیگیری و چند حالت مرتب‌سازی.
- Light / Dark / System با آبی برند به‌عنوان رنگ پیش‌فرض، چند پالت جایگزین و رنگ سفارشی.
- تغییر سریع Light/Dark و پالت از Navbar.
- PWA قابل نصب با Web Manifest، Service Worker و آیکن maskable.
- local-first با Dexie؛ بدون Login و Backend.

## رابط فارسی

- `lang="fa"` و `dir="rtl"` از root.
- فونت Mikhak و ارقام نمایشی فارسی.
- PriceInput و IntegerInput فارسی.
- Selectهای PersianLabs با `items` map.
- DatePicker جلالی با موتور Doran و هماهنگی با Light/Dark/Custom Theme.
- Popover در دسکتاپ و Bottom Sheet قابل drag-to-dismiss در موبایل.

## داده و Migration

نام دیتابیس عمداً تغییر نکرده است تا داده کاربران نسخه‌های قبلی از بین نرود:

```text
estelamkoo-local
```

Schema version:

```text
4
```

جدول‌ها:

```text
purchaseCases
providers
quotes
reminders
attachments
```

Migration نسخه 4 داده‌های قبلی را حفظ می‌کند و قابلیت‌های جدید را به‌صورت optional اضافه می‌کند. `reminders` و `attachments` جدول‌های جدید هستند.

### محدودیت مهم local-first

یادآوری‌های این نسخه **داخل خود بسنج** نمایش داده می‌شوند و Push Notification سیستم‌عامل نیستند. فایل‌های پیوست نیز فقط در IndexedDB همان Browser/Profile قرار دارند و با پاک‌کردن داده سایت از بین می‌روند. Backup/Cloud Sync باید در فازهای بعدی اضافه شود.

## محدودیت فایل‌های پیوست

- حداکثر ۵ فایل برای هر استعلام.
- حداکثر ۸ مگابایت برای هر فایل.
- حداکثر ۲۴ مگابایت مجموع فایل‌های یک استعلام.
- تصویر، PDF، Word، Excel و فایل متنی در فرم انتخاب می‌شوند.

## نصب و اجرا

نسخه پیشنهادی Node در `.nvmrc` ثبت شده است.

```bash
npm install
npm run dev
```

## کنترل کیفیت

گیت کامل:

```bash
npm run check
```

ترتیب اجرا:

```text
doctor
check:ui
check:theme
check:pwa
check:workflow
typecheck
lint
test
build
```

Guard جدید `check:workflow` بررسی می‌کند که Schema v4، یادآوری‌ها، پیوست‌ها، بودجه/شروط و Today Queue به‌صورت اتفاقی از سورس حذف نشده باشند.

## نصب به‌عنوان اپ (PWA)

Service Worker فقط در production ثبت می‌شود تا `next dev` درگیر cache قدیمی نشود.

```bash
npm run build
npm start
```

سپس `http://localhost:3000` را باز کن. برای انتشار عمومی PWA باید روی HTTPS باشد.

## ساختار مهم فاز 0.5

```text
components/case-planning-sheet.tsx
components/case-follow-up-sheet.tsx
components/provider-rating-sheet.tsx
components/today-queue.tsx
components/case-details-panel.tsx
components/quote-form-dialog.tsx
components/quote-comparison.tsx
components/decision-assistant.tsx
lib/planning.ts
lib/follow-up.ts
lib/attachments.ts
lib/db.ts
scripts/check-workflow.mjs
```

## قانون UI

برای کنترل‌های عمومی ابتدا PersianLabs/ui استفاده می‌شود. DatePicker استثنای مستند است: موتور تقویم Doran است اما primitiveها و ظاهر متعلق به پروژه هستند.

## توسعه امن از نسخه پایدار

پیشنهاد برای شروع این فاز از main پایدار:

```bash
git switch -c feat/follow-up-workspace-v0.5
```

پس از Replace کردن سورس و سبز شدن `npm run check`:

```bash
git add .
git commit -m "feat: add Besanj follow-up workspace v0.5.1"
```

## منابع

جزئیات کتابخانه‌ها در `THIRD_PARTY.md`، تغییرات این نسخه در `docs/RELEASE_0.5.1.md` و نتیجه QA در `QA.md` آمده است.
