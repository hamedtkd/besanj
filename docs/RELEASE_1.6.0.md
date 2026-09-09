# Besanj 1.6.0 - قالب های سریع

این نسخه روی v1.5.1 ساخته شده و هدف اصلی آن کم کردن زمان شروع خریدهای تکراری است. مسیر ثبت سریع، Groq Voice، Seller Profile، بودجه و Insights بدون حذف یا تغییر رفتار باقی مانده اند.

## قابلیت اصلی

- ۸ قالب آماده برای سناریوهای رایج کالا و خدمت.
- Sheet مستقل قالب ها با جست وجو و تب آماده/شخصی.
- استفاده از قالب به شکل review-first: فرم پرونده پر می شود ولی کاربر می تواند همه چیز را تغییر دهد.
- ذخیره هر پرونده موجود به عنوان قالب شخصی.
- بودجه در قالب شخصی opt-in است و به صورت پیش فرض ذخیره نمی شود.
- favorite و usage tracking برای مرتب سازی قالب های شخصی.
- حذف قالب شخصی با تأیید دو مرحله ای.

## مرز داده قالب

قالب فقط داده های قابل استفاده دوباره را نگه می دارد:

```text
name
kind
description
targetBudgetToman اختیاری
categoryKey / categoryLabel
tags
requirementLabels
favorite
useCount / lastUsedAt
```

قالب هیچ Provider، SellerProfile، Quote، Reminder، Attachment، selectedQuoteId یا PurchaseOutcome را کپی نمی کند. هنگام ساخت پرونده، Requirementها شناسه تازه دریافت می کنند.

## دیتابیس

- Dexie: v7
- جدول جدید: `caseTemplates`
- indexها: id، name، kind، categoryKey، updatedAt و lastUsedAt
- هیچ boolean index اضافه نشده است.
- جدول ها و migrationهای قبلی دست نخورده باقی مانده اند.

## Backup

Backup format همچنان version 1 است. `caseTemplates` به صورت optional اضافه شده، بنابراین فایل های قدیمی بدون این بخش همچنان import می شوند. Built-in templateها بخشی از source هستند و وارد Backup نمی شوند.

## UI

- «قالب ها» در اکشن های داشبورد دسکتاپ.
- «قالب ها» در action bar موبایل کنار «ثبت سریع».
- «ذخیره قالب» در header هر پرونده.
- Tooltipهای PersianLabs برای توضیحات فرعی همچنان استفاده می شوند.
- فرم Create Case بعد از اعمال قالب همچنان کاملاً قابل ویرایش است.

## Quality

- Guard جدید: `check:templates`
- تست های pure در محیط ساخت: 132/132 PASS
- همه Guardهای مستقل از dependency: PASS
- TS/TSX syntax: 155 فایل، 0 خطا
- Local imports: 667 بررسی، 0 مسیر شکسته

گیت نهایی روی سیستم مقصد:

```bash
npm audit
npm run check
```

## PWA

Service Worker cache version به `besanj-shell-v19` افزایش یافته است. Mikhak FD و loader حالت Voice محلی همچنان در cache shell قرار دارند.
