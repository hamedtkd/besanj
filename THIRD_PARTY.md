# Third-party source notes

## PersianLabs/ui

کنترل‌های عمومی رابط کاربری بسنج از Registry عمومی PersianLabs/ui کپی/اقتباس شده‌اند و با تم محصول تنظیم شده‌اند:

- Button
- Card
- Badge
- Input
- Textarea
- Field
- PriceInput
- InputGroup
- TomanIcon
- Select
- Checkbox
- RadioGroup
- MobileNumberInput
- Popover
- Tabs

مراجع:

- https://ui.persian-labs.ir/docs
- https://github.com/persianlabs/ui

قاعدهٔ محصول این است که برای کنترل‌های عمومی، قبل از ساخت جایگزین جدید ابتدا PersianLabs/ui بررسی شود. Selectها `items` map دارند و PriceInput فقط با TomanIcon ترکیب می‌شود.

## Doran

تقویم شمسی از نسخه 0.4 به بعد از موتور Doran استفاده می‌کند:

- https://github.com/amiralibg/Doran
- https://amiralibg.github.io/Doran/guide/getting-started
- https://amiralibg.github.io/Doran/guide/shadcn
- https://amiralibg.github.io/Doran/guide/migration

طبق الگوی shadcn خود Doran، ظاهر DatePicker متعلق به پروژه است و موتور Doran فقط منطق تقویم جلالی، grid، ناوبری کیبورد و محاسبات تاریخ را فراهم می‌کند. در دسکتاپ از Popover خود پروژه و در موبایل از ResponsiveSheet قابل drag-to-dismiss استفاده می‌شود.

## Mikhak

رابط کاربری بسنج از نسخه فارسی-رقم فونت متغیر Mikhak استفاده می کند. فایل انتخاب شده همان `Mikhak-FD[DSTY,KSHD,wght].woff2` از مخزن اصلی است و برای ثبات Release به commit `9dea055eb3dfc752879442224460c6e5d6ebe232` پین شده است.

- https://github.com/aminabedi68/Mikhak
- https://aminabedi68.github.io/Mikhak/
- License: SIL Open Font License 1.1
- متن مجوز داخل `docs/licenses/MIKHAK_OFL.txt` نگه داری می شود.

فونت از jsDelivr با همان commit ثابت بارگذاری می شود و Service Worker آن را برای استفاده بعدی cache می کند. در این درخواست فقط فایل عمومی فونت دریافت می شود و هیچ داده پرونده، فروشنده، استعلام یا Backup به سرویس بیرونی ارسال نمی شود.

## Recharts

نمودار تاریخچه قیمت با Recharts ساخته شده و از tokenهای رنگی تم بسنج استفاده می‌کند.


## Browser platform APIs used in v0.8

- Web Notifications API
- Service Worker notification click handling
- Badging API (feature-detected, optional)

No third-party notification or push SDK was added.


## v1.0 purchase completion

برای ثبت نتیجه خرید و پیگیری تحویل هیچ SDK یا کتابخانه third-party جدیدی اضافه نشده است. این فاز از primitiveهای موجود پروژه، Dexie و همان Web Notification/Badging APIهای قبلی استفاده می‌کند.
