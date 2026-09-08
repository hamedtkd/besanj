# QA — Besanj 0.5.1

## اصلاح این Patch

در 0.5.0 تست `dashboard queue surfaces quote expiring tomorrow` روی سیستم کاربر با timezone تهران fail شد، در حالی که در محیط UTC پاس می‌شد. علت این بود که `validUntil` بعد از parse شدن به `Date` به timezone محلی تبدیل می‌شد و ساعت `23:59:59Z` به روز بعد می‌رفت.

در 0.5.1 محاسبه روز برای `dueAt` و `validUntil` بر اساس روز تقویمی ذخیره‌شده در بخش `YYYY-MM-DD` انجام می‌شود و `now` همچنان روز محلی کاربر را مبنا قرار می‌دهد.

## بررسی‌های اجراشده در محیط ساخت

- Follow-up tests در UTC: PASS
- Follow-up tests با `TZ=Asia/Tehran`: PASS
- Full unit suite در UTC: PASS
- Full unit suite با `TZ=Asia/Tehran`: PASS
- UI/Theme/PWA/Workflow guardها بدون تغییر ساختاری باقی مانده‌اند.
- Service Worker cache version: `besanj-shell-v6`

## گیت نهایی روی سیستم مقصد

```bash
npm install
npm run check
```
