# Besanj 0.4.4

## هویت بصری جدید

- رنگ پیش‌فرض محصول از کهربایی به آبی-نیلی تغییر کرد: `#2563EB` در Light و `#60A5FA` در Dark.
- پس‌زمینه، متن، muted، accent، border و glass از warm-neutral به cool-neutral منتقل شدند تا رابط با هویت آبی جدید هماهنگ باشد.
- کهربایی حذف نشده و همچنان به‌عنوان پالت اختیاری در تنظیمات در دسترس است.
- برای کاربران نسخه‌های قبلی، مقدار legacy `amber` یک بار به آبی برند migrate می‌شود؛ custom/violet/rose/blue دست‌نخورده می‌مانند.
- رنگ custom اولیه نیز از رز به آبی برند تغییر کرد.

## لوگو و Iconography

- فایل SVG ارائه‌شده توسط صاحب پروژه در `public/brand/besanj.svg` قرار گرفت.
- BrandMark نوار بالای برنامه به لوگوی جدید متصل شد.
- favicon جدید، `app/icon.svg`، Apple Touch Icon، آیکن 192px، 512px و Maskable 512px از همین نشان ساخته شدند.
- Maskable icon پس‌زمینه آبی و نشان سفید دارد تا در launcherهای Android امن crop شود.

## PWA و نصب برنامه

- `app/manifest.ts` اضافه شد: نام، توضیح، `standalone`، RTL، theme/background color و آیکن‌های نصب.
- Service Worker در `public/sw.js` اضافه شد.
- strategy ناوبری network-first است؛ static assetهای Next/brand/icon به‌صورت cache-first نگه داشته می‌شوند.
- Service Worker فقط در production ثبت می‌شود تا Dev Mode گرفتار cache قدیمی نشود.
- `PwaInstallProvider` از لحظه شروع اپ listener مربوط به `beforeinstallprompt` را نگه می‌دارد تا prompt قبل از باز شدن Settings از دست نرود.
- بخش «نصب روی دستگاه» به Settings اضافه شد: نصب مستقیم در Chromium، وضعیت نصب‌شده و راهنمای iOS.
- metadata مربوط به manifest، favicon، Apple Web App و theme color در Root Layout تکمیل شد.

## Guard

`npm run check:pwa` اضافه شد و موارد زیر را بررسی می‌کند:

- وجود manifest و Service Worker
- وجود favicon / Apple icon / 192 / 512 / maskable
- اتصال Navbar به لوگوی Besanj
- ثبت Service Worker
- mount شدن Install Provider از startup
- theme color آبی پیش‌فرض

`npm run check` اکنون `check:pwa` را هم اجرا می‌کند.
