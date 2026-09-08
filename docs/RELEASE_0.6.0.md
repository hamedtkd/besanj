# Release 0.6.0 — Data portability & repeat purchase

## Product goal

بعد از اضافه‌شدن پیگیری و پیوست در 0.5، داده محلی ارزشمندتر شد. این نسخه دو مشکل بعدی را حل می‌کند:

1. کاربر بتواند همه داده و فایل‌هایش را از Browser خارج کند و دوباره برگرداند.
2. خریدهای تکراری بدون کپی شدن تاریخچه قیمت قبلی سریع شروع شوند.

## Backup format

- `format`: `besanj-backup`
- `version`: `1`
- JSON UTF-8
- پیوست‌ها به Base64 تبدیل می‌شوند.
- تنظیمات Theme/Palette نیز در فایل قرار می‌گیرد.
- Restore ساختار فایل و حجم واقعی پیوست decodeشده را بررسی می‌کند.

## Restore semantics

Restore در این نسخه `replace` است. عملیات پاک‌سازی و bulkAdd داده‌ها در یک Dexie transaction انجام می‌شود. تنظیمات ظاهر فقط بعد از موفقیت transaction نوشته می‌شوند.

## Repeat purchase

پرونده جدید:
- status = active
- selectedQuoteId = undefined
- quote/reminder/attachment = none
- requirements = fresh ids
- provider ids = fresh ids

در صورت انتخاب کاربر، budget، requirements و providers کپی می‌شوند.

## UX additions

- Settings > پشتیبان و انتقال داده
- جزئیات پرونده > خرید مشابه
- فرم ثبت استعلام > انتخاب سریع فروشنده قبلی

## QA

برای گیت مرجع:

```bash
npm run check
```

Guard جدید:

```bash
npm run check:data
```
