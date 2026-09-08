# Besanj 0.5.1 — Timezone-safe follow-up dates

## اصلاح

- محاسبه «امروز/فردا» برای `validUntil` و `dueAt` دیگر زمان ISO را به timezone سیستم تبدیل نمی‌کند.
- این دو فیلد در بسنج ماهیت «روز تقویمی» دارند؛ بنابراین بخش `YYYY-MM-DD` همان روزی است که کاربر انتخاب کرده است.
- با این تغییر، مقداری مثل `2026-09-09T23:59:59Z` در timezone تهران به اشتباه روز ۱۰ سپتامبر تلقی نمی‌شود.
- Today Queue حالا در timezoneهای مختلف نتیجه یکسانی برای روز انتخاب‌شده می‌دهد.
- یک regression test مستقل از timezone برای ISO offset اضافه شد.

## QA

- تست Follow-up در UTC پاس.
- همان تست با `TZ=Asia/Tehran` پاس.
- کل unit test suite باید روی سیستم مقصد با `npm run check` اجرا شود.
