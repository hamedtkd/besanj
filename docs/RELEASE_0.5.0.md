# Besanj 0.5.0 — Follow-up Workspace

## هدف

تبدیل بسنج از دفتر ثبت و مقایسه قیمت به فضای کاری کوچک برای «پیگیری تا تصمیم خرید» بدون اضافه‌کردن Backend یا Account.

## قابلیت‌های جدید

### بودجه و شروط خرید

- `targetBudgetToman` روی پرونده.
- `requirements` با شناسه پایدار روی پرونده.
- فرم ساخت پرونده و Sheet ویرایش برنامه خرید.
- وضعیت داخل/نزدیک/بالای بودجه در کارت‌ها و مقایسه.

### پوشش شروط روی هر استعلام

- `requirementChecks` روی Quote.
- Checklist در فرم استعلام.
- نمایش میزان پوشش در کارت مقایسه و مقایسه کنارهم.
- تفکیک «بررسی نشده» از «۰ شرط پاس شده».

### اعتماد فروشنده

- `rating` از ۱ تا ۵ و `ratingNote` روی Provider.
- Sheet امتیازدهی در جزئیات پرونده.
- استفاده از Rating در Decision Assistant.

### پیگیری

- جدول جدید `reminders`.
- ساخت یادآوری برای پرونده و در صورت نیاز فروشنده/استعلام.
- Today Queue در Dashboard.
- تشخیص یادآوری سررسید، قیمت رو به انقضا، پرونده stale و پرونده آماده تصمیم.
- Mark done و حذف یادآوری.

### پیوست

- جدول جدید `attachments` با Blob داخل IndexedDB.
- ثبت فایل همزمان با Quote.
- نمایش/بازکردن/دانلود و حذف از جزئیات پرونده.
- حذف cascade هنگام حذف Quote.

### تصمیم‌یار

- بودجه پرونده به‌عنوان مقدار اولیه.
- وزن پوشش شروط و اعتماد فروشنده در score.
- حفظ hard constraints قبلی برای بودجه، تازگی و تحویل.

## دیتابیس

Dexie schema از نسخه 3 به **4** ارتقا یافت. نام دیتابیس قدیمی عمداً حفظ شده تا داده کاربر باقی بماند.

## PWA

Service Worker cache از `besanj-shell-v5` به `besanj-shell-v6` ارتقا یافت.

## QA

در محیط ساخت:

- 47/47 unit tests پاس.
- UI/Theme/PWA/Workflow guards پاس.
- 90 فایل TypeScript از نظر syntax/transpile پاس.
- 316 import محلی بدون مسیر شکسته.

Full typecheck/lint/production build باید روی سیستم مقصد با `npm run check` اجرا شود.
