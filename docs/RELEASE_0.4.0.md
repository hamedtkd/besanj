# Release 0.4.0

## تغییرات اصلی

- مهاجرت DatePicker به موتور Doran (`@doranjs/core` + `@doranjs/react`) با تقویم جلالی، ارقام فارسی و UI هم‌خانوادهٔ پروژه.
- انتخاب سریع اعتبار قیمت: همان روز، ۳ روز، ۱ هفته، ۲ هفته و ۱ ماه.
- Bottom Sheet موبایل با drag-to-dismiss بر اساس الگوی Poolamkoo؛ این رفتار روی تمام Sheetهای اصلی محصول مشترک است.
- حذف نمایش `null` / `undefined` / `NaN` از داده‌های قدیمی و migration دیتابیس به version 3.
- نمایش فارسی اعداد در PriceInput، IntegerInput، MobileNumberInput و متن‌های عدددار ذخیره‌شده.
- حذف DatePicker قبلی و dependencyهای `react-day-picker` / `date-fns` / `@daypicker/persian`.
- هم‌ارتفاع شدن کارت‌های صفحهٔ اصلی.
- بازطراحی کارت‌های مقایسه: hierarchy واضح‌تر، stroke قوی‌تر، price surface، وضعیت‌ها و Primary CTA برای انتخاب نهایی.
- شفاف شدن رفتار «انتخاب نهایی» و «لغو انتخاب نهایی».
- رنگ سفارشی مشابه الگوی Poolamkoo با preview زنده، Hue/Saturation/Value، Hex و حداکثر ۸ رنگ ذخیره‌شده.
- Light / Dark / System و پالت‌های کهربایی، آبی، بنفش، رز و سفارشی.
- تقویت border/input stroke در Light و Dark.
- custom theme tokens برای chartها، ring و glass border.

## دیتابیس

Schema version: **3**

Migration v3 داده‌ای را حذف نمی‌کند. فقط رشته‌های optional ناسالم و sentinelهای قدیمی را به مقدار خالی واقعی تبدیل می‌کند و numeric `null`های قدیمی را پاک‌سازی می‌کند.

## سازگاری

داده‌های نسخه‌های 0.1 تا 0.3 در همان دیتابیس `estelamkoo-local` باقی می‌مانند و هنگام باز شدن نسخهٔ جدید migrate می‌شوند.

## QA محیط ساخت

- 31/31 unit test پاس
- UI policy پاس
- 68 فایل TS/TSX در syntax/transpile scan بدون خطا
- 0 local import شکسته
- 0 local named-export گمشده
- 0 unused import در scan داخلی

نصب npm در محیط ساخت به دلیل `EAI_AGAIN` روی registry عمومی ممکن نبود؛ بنابراین typecheck/lint/Next production build باید بعد از `npm install` روی سیستم مقصد با `npm run check` اجرا شود.
