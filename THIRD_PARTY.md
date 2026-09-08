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

UI فونت variable Mikhak را از همان منبع عمومی GitHub/jsDelivr مورد استفاده در Poolamkoo بارگذاری می‌کند:

- https://github.com/aminabedi68/Mikhak

## Recharts

نمودار تاریخچه قیمت با Recharts ساخته شده و از tokenهای رنگی تم بسنج استفاده می‌کند.
