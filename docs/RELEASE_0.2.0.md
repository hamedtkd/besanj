# 0.2.0 — Comparison & Decision Flow

این نسخه روی بازخورد UX نسخه اولیه متمرکز است.

## Fixed

- حذف date input native و جایگزینی با DatePicker شمسی PersianLabs-style
- اصلاح PriceInput و currency suffix با InputGroup + TomanIcon
- حذف NativeSelect و استفاده از Select portaled/RTL
- استفاده از MobileNumberInput و Field primitives مناسب
- guardrail خودکار برای جلوگیری از بازگشت کنترل‌های native

## Added

- کانال‌های استعلام اجتماعی/پیام‌رسان و `contactRef`
- تاریخچه اختصاصی هر فروشنده
- فیلترهای گسترده روی آخرین استعلام‌ها
- shortlist حداکثر ۴ گزینه
- مقایسه side-by-side
- نمودار تمام revisionهای قیمت هر فروشنده
- decision assistant با اولویت‌ها و hard constraints
- Dexie schema v2 بدون پاک‌کردن دیتای v1
