# Besanj 1.5.1 - گفتار دقیق تر با هوش مصنوعی

این Patch روی `v1.5.0` ساخته شده است. تجربه ثبت سریع، parser محلی، Seller Profile، Backup و مدل داده تغییری نکرده اند. تغییر اصلی فقط مسیر تبدیل صدای کاربر به متن است.

## چرا مسیر قبلی کافی نبود

Whisper Tiny داخل مرورگر سبک و خصوصی بود، اما روی بعضی دستگاه ها و روی نام برند، مدل کالا و جمله های کوتاه فارسی دقت کافی نداشت. به همین دلیل حالت ابری دقیق تر به مسیر اصلی Voice تبدیل شده و حالت محلی به عنوان گزینه حریم خصوصی باقی مانده است.

## مسیر اصلی Voice

1. کاربر «با هوش مصنوعی بگو» را می زند.
2. Browser حداکثر 45 ثانیه صدا را با `MediaRecorder` ضبط می کند.
3. فایل فقط به route داخلی `/api/transcribe` ارسال می شود.
4. route سرور با `GROQ_API_KEY` درخواست را به Groq Speech-to-Text می فرستد.
5. مدل پیش فرض `whisper-large-v3` و زبان `fa` است.
6. متن برگشتی وارد parser ثبت سریع v1.5 می شود.
7. هیچ داده ای بدون بررسی و تأیید کاربر ذخیره نمی شود.

## تنظیم سرویس

فایل `.env.local` در ریشه پروژه:

```env
GROQ_API_KEY=...
GROQ_TRANSCRIBE_MODEL=whisper-large-v3
```

`.env.example` نمونه بدون secret را نگه می دارد. کلید نباید با `NEXT_PUBLIC` تعریف شود و نباید در Git قرار بگیرد.

## حریم خصوصی

- پرونده ها، فروشنده ها، قیمت ها، بودجه و تاریخچه همچنان local-first هستند.
- فقط وقتی کاربر دکمه حالت هوش مصنوعی را می زند، صدای همان ضبط برای transcription به Groq ارسال می شود.
- متن برگشتی قبل از ثبت نمایش داده می شود.
- route پاسخ را با `Cache-Control: no-store` می فرستد.
- بسنج فایل صوتی را در Dexie، Backup یا localStorage ذخیره نمی کند.
- اگر کاربر نمی خواهد صدا ارسال شود، دکمه «تشخیص محلی» باقی مانده است.

## حالت محلی

مسیر محلی قبلی حذف نشده است:

- `SpeechRecognition.processLocally = true`
- در صورت نبودن آن، Whisper Tiny داخل مرورگر
- مدل `onnx-community/whisper-tiny`
- زبان `fa`
- WebGPU و fallback به WASM
- runtime مرورگری ثابت Transformers.js 4.2.0
- بدون API key و بدون upload صدا

## امنیت و هزینه

کلید Groq فقط روی سرور استفاده می شود. Browser هرگز مقدار کلید را دریافت نمی کند. هیچ SDK جدید npm نصب نشده و route با `fetch` استاندارد Next.js به Groq وصل می شود.

برای استفاده شخصی و توسعه، Free Plan سرویس Groq قابل استفاده است. اگر برنامه روی یک URL عمومی بدون احراز هویت منتشر شود، route گفتار نیز عمومی خواهد بود و باید قبل از استفاده عمومی، کنترل دسترسی یا محدودیت مصرف اضافه شود.

## فایل های اصلی

```text
app/api/transcribe/route.ts
components/local-voice-capture.tsx
lib/cloud-transcription.ts
lib/local-speech.ts
lib/local-whisper.ts
scripts/check-cloud-voice.mjs
scripts/check-voice-fallback.mjs
tests/cloud-transcription.test.ts
tests/local-whisper.test.ts
.env.example
```

## داده و migration

- Dexie: بدون تغییر، همچنان v6
- Backup format: بدون تغییر
- migration: ندارد
- Draft ثبت سریع: بدون تغییر
- Quote/Provider/Seller IDs: بدون تغییر

## PWA

Service Worker همچنان `besanj-shell-v18` است. routeهای `/api/` توسط Service Worker cache نمی شوند.

## Quality gate

`npm run check` اکنون علاوه بر Guardهای قبلی، `check:cloud-voice` را هم اجرا می کند. این Guard بررسی می کند که کلید فقط server-side باشد، مدل پیش فرض Whisper Large V3 باشد، زبان فارسی اجباری باشد، محدودیت اندازه فایل وجود داشته باشد، پاسخ cache نشود و حالت محلی همچنان باقی بماند.

## تست مقصد

```bash
npm install
npm audit
npm run check
```

بعد:

```bash
npm run dev
```

یک ضبط واقعی با «با هوش مصنوعی بگو» انجام بده و نتیجه متن و استخراج قیمت را بررسی کن.

## fix5 - Tooltip سراسری و UI خلوت تر

بر اساس درخواست محصول، توضیحات غیرحیاتی که قبلاً همیشه زیر عنوان ها و فیلدها دیده می شدند به راهنمای Tooltip منتقل شدند. مبنا دقیقاً Tooltip رسمی PersianLabs/ui است و پیاده سازی RTL آن حفظ شده است.

تغییرات اصلی:

- اضافه شدن `components/ui/tooltip.tsx` از Registry رسمی PersianLabs/ui با adaptation فقط برای z-index بسنج.
- اضافه شدن `HelpHint` با آیکن سوال و PersianLabs Button.
- `TooltipProvider` یک بار در Providerهای سراسری اپ قرار دارد.
- `ResponsiveSheet.description` دیگر متن دائمی زیر عنوان تولید نمی کند و به HelpHint تبدیل می شود.
- `FormField.hint` به HelpHint منتقل شده ولی `FieldError` همچنان مستقیم و همیشه قابل دیدن است.
- راهنماهای ثبت سریع، Voice، تنظیمات، Backup، بودجه، فروشنده، Insights، Timeline، نمودار، تاریخچه و Decision Assistant خلوت شده اند.
- هشدارهای مهم مثل جایگزینی Backup، محدودیت اعلان پس زمینه و stale شدن انتخاب نهایی عمداً مستقیم روی صفحه مانده اند.
- Guard جدید `check:tooltips` به pipeline اصلی اضافه شده است.

این تغییر هیچ migration دیتابیس، تغییر Backup format، dependency جدید npm یا تغییر در API گفتار ایجاد نمی کند.

