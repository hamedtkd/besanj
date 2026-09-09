# Besanj 1.4.0

## موضوع Release

تجربه بومی فارسی، فونت Mikhak با رقم فارسی و یکپارچه سازی نمایش اعداد و تاریخ در کل برنامه.

این فاز مدل داده و منطق خرید را تغییر نمی دهد. هدف آن این است که تمام بخش های رابط کاربری، نمودارها، گزارش ها، شماره ها، درصدها و تاریخ ها با یک سیاست ثابت فارسی نمایش داده شوند.

## فونت Mikhak

فونت اصلی رابط کاربری Mikhak است. در این نسخه از فایل متغیر مخصوص رقم فارسی استفاده می شود:

```text
Mikhak-FD[DSTY,KSHD,wght].woff2
```

مخزن اصلی:

```text
https://github.com/aminabedi68/Mikhak
```

نسخه فونت برای تکرارپذیری Release به commit زیر پین شده است:

```text
9dea055eb3dfc752879442224460c6e5d6ebe232
```

وزن های 100 تا 900 از همان فایل variable استفاده می شوند. فونت برای body، کنترل های فرم، Tailwind `font-sans` و متن های Recharts فعال است.

مجوز فونت SIL Open Font License 1.1 است و متن آن در `docs/licenses/MIKHAK_OFL.txt` نگه داری می شود.

## رقم فارسی

Locale عددی مرکزی:

```text
fa-IR-u-nu-arabext
```

Locale تاریخ شمسی مرکزی:

```text
fa-IR-u-ca-persian-nu-arabext
```

این انتخاب باعث می شود اعداد خروجی Intl به شکل `۰۱۲۳۴۵۶۷۸۹` باشند، نه رقم لاتین یا Arabic-Indic.

فایل جدید `lib/persian-number.ts` این مرز نمایش را متمرکز می کند و شامل موارد زیر است:

```text
toPersianDigits
formatPersianNumber
formatPersianInteger
formatPersianDecimal
formatPersianPercent
```

`toPersianDigits` هم رقم لاتین `0-9` و هم رقم Arabic-Indic `٠-٩` را به رقم فارسی تبدیل می کند.

## Audit کل UI

تمام استفاده های مستقیم از `toLocaleString("fa-IR")` به locale صریح `fa-IR-u-nu-arabext` منتقل شده اند. NumberFormat و DateTimeFormatهای رابط کاربری هم رقم فارسی را به صورت صریح درخواست می کنند.

این Audit شامل بخش های زیر است:

- داشبورد و فیلترها
- کارت پرونده و صفحه پرونده
- مقایسه و تصمیم یار
- استعلام، تاریخچه قیمت و نمودارها
- بودجه و Insights
- پروفایل فروشنده و فهرست فروشنده ها
- اعلان ها و کارهای امروز
- Backup UI
- گزارش چاپی
- امتیازها، تعدادها، درصدها و شماره تلفن

## تاریخ فارسی

فرمت های تاریخ همچنان با تقویم شمسی اجرا می شوند، اما numbering system نیز صریح شده است. تاریخ های کامل، کوتاه و تاریخ-زمان همگی رقم فارسی تولید می کنند.

DatePicker Doran و ساختار RTL قبلی بدون تغییر معماری حفظ شده اند.

## PWA و Offline

Service Worker cache version:

```text
besanj-shell-v15
```

فایل Mikhak FD در فهرست core assetها قرار گرفته و Service Worker درخواست همان URL پین شده را cache می کند. اگر نصب اولیه در حالت بدون شبکه انجام شود، fallback سیستم مانع شکستن UI می شود و در اولین دسترسی موفق فونت cache خواهد شد.

هیچ داده کاربر به سرویس فونت ارسال نمی شود. تنها درخواست خارجی مربوط به دریافت فایل عمومی فونت است.

## Guard جدید

```text
npm run check:persian-ui
```

این Guard موارد زیر را کنترل می کند:

- استفاده از Mikhak FD و commit ثابت
- ممنوع بودن URL mutable روی `master`
- فعال بودن Mikhak در body، Tailwind و Recharts
- `lang="fa"` و `dir="rtl"`
- cache فونت در Service Worker v15
- locale صریح رقم فارسی
- پوشش رقم لاتین و Arabic-Indic در normalization
- نبود formatterهای قدیمی `fa-IR` بدون `nu-arabext`
- ثبت منبع و مجوز Mikhak در THIRD_PARTY

## تست های اضافه شده

`tests/persian-ui.test.ts` پوشش می دهد:

- تبدیل رقم لاتین به فارسی
- تبدیل Arabic-Indic به فارسی
- فرمت عدد صحیح، اعشاری و درصد
- مبلغ و شماره تلفن
- تاریخ شمسی با رقم فارسی
- متن ترکیبی دارای رقم

## مدل داده و Dependency

- Dexie همچنان v6 است.
- Migration جدید وجود ندارد.
- dependency جدید npm اضافه نشده است.
- Next.js همچنان 16.3.4 است.
- Backup format تغییر نکرده است.

## فایل های اصلی این Release

```text
app/globals.css
lib/persian-number.ts
lib/persian-date.ts
lib/format.ts
public/sw.js
scripts/check-persian-ui.mjs
scripts/check-pwa.mjs
tests/persian-ui.test.ts
docs/licenses/MIKHAK_OFL.txt
THIRD_PARTY.md
README.md
QA.md
```

## Branch پیشنهادی

```text
feat/persian-native-v1.4
```
