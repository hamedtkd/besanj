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
- Tooltip

مراجع:

- https://ui.persian-labs.ir/docs
- https://github.com/persianlabs/ui

قاعدهٔ محصول این است که برای کنترل‌های عمومی، قبل از ساخت جایگزین جدید ابتدا PersianLabs/ui بررسی شود. Selectها `items` map دارند و PriceInput فقط با TomanIcon ترکیب می‌شود.

### Tooltip و راهنمای رابط

از fix5 نسخه 1.5.1، Tooltip سراسری بسنج مستقیماً بر مبنای سورس Registry رسمی PersianLabs/ui ساخته شده است:

- Docs: https://ui.persian-labs.ir/docs/components/tooltip
- Source: https://github.com/persianlabs/ui/blob/208efb411fa25ed133e60e558f11777fdc717d3a/packages/ui/src/components/tooltip.tsx
- Primitive: Base UI Tooltip

پیاده سازی RTL خود PersianLabs، شامل انتقال direction به محتوای portaled و `DirectionProvider`، حفظ شده است. فقط z-index با لایه های `ResponsiveSheet` بسنج هماهنگ شده تا Tooltip روی Sheet پنهان نشود.

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

## Transformers.js and Whisper Tiny - v1.5.1

برای fallback گفتار به متن روی دستگاه، بسنج runtime مرورگری Transformers.js نسخه 4.2.0 را فقط هنگام نیاز از URL نسخه ثابت زیر دریافت می کند:

- Runtime: https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/dist/transformers.min.js
- Source: https://github.com/huggingface/transformers.js
- License: Apache License 2.0

این runtime به عنوان dependency npm نصب نمی شود. علت این انتخاب این است که بسته کامل npm برای محیط های Node نیز dependencyهایی مثل runtime پردازش تصویر و ONNX Node وارد می کند که در مسیر مرورگری بسنج استفاده نمی شوند. حذف آن dependencyها سطح حمله و گزارش audit پروژه را کوچک نگه می دارد.

مدل پیش فرض transcription:

- `onnx-community/whisper-tiny`
- Base model: `openai/whisper-tiny`
- زبان در زمان transcription: `fa`
- Model license: Apache License 2.0
- https://huggingface.co/onnx-community/whisper-tiny
- https://huggingface.co/openai/whisper-tiny

فایل runtime و مدل همراه ZIP پروژه توزیع نمی شوند. بار اول فقط فایل عمومی runtime از jsDelivr و فایل های عمومی مدل از Hugging Face Hub دریافت می شوند. صوت ضبط شده فقط به pipeline داخل مرورگر داده می شود و هیچ endpoint برای upload صوت، API key یا fallback ابری در این مسیر وجود ندارد.


## GroqCloud Speech-to-Text

بسنج در حالت اختیاری «با هوش مصنوعی بگو» از API گفتار GroqCloud استفاده می کند. این یک سرویس خارجی است و کتابخانه Groq به dependencyهای npm پروژه اضافه نشده است.

- Endpoint: `https://api.groq.com/openai/v1/audio/transcriptions`
- مدل پیش فرض: `whisper-large-v3`
- کلید: فقط `GROQ_API_KEY` سمت سرور
- داده ارسالی: فقط فایل صوتی همان ضبطی که کاربر صریحاً برای تبدیل به متن آغاز می کند
- حالت محلی بدون ارسال صوت همچنان موجود است

شرایط استفاده، محدودیت ها و سیاست داده این سرویس تابع مستندات و قرارداد خود GroqCloud است.
