# QA | Besanj 1.7.0

## Patch گفتار دقیق تر با هوش مصنوعی

- مسیر اصلی Voice: Groq Speech-to-Text
- مدل پیش فرض: `whisper-large-v3`
- زبان اجباری: `fa`
- prompt مخصوص متن استعلام خرید
- API key فقط در `GROQ_API_KEY` سمت سرور
- route داخلی `/api/transcribe`
- حداکثر فایل ابری: 10 MB
- پاسخ route با `no-store`
- بدون SDK جدید npm
- حالت «تشخیص محلی» همچنان فعال
- Whisper Tiny محلی و SpeechRecognition محلی حذف نشده اند
- Review-first و parser ثبت سریع بدون تغییر
- Dexie v6 و Backup بدون تغییر
- Guard جدید `check:cloud-voice`
- Guard `check:voice-fallback` باقی مانده است
- Service Worker `besanj-shell-v18`

## بررسی های محیط ساخت

- کل تست ها: **124/124 PASS**
- `tests/cloud-transcription.test.ts`: **5/5 PASS**
- `tests/local-whisper.test.ts`: **4/4 PASS**
- `check:cloud-voice`: **PASS**
- `check:voice-fallback`: **PASS**
- `check:quick-capture`: **PASS**
- dependency npm جدید: **ندارد**

## گیت نهایی روی سیستم مقصد

```bash
npm install
npm audit
npm run check
```

بعد از سبز شدن Check، تست واقعی میکروفن با کلید Groq انجام شود.

---

# QA | Besanj 1.5.0

## فاز ثبت سریع

- ثبت پرونده فقط با عنوان
- ثبت Quote روی پرونده موجود یا ساخت Case + Quote در یک مرحله
- Paste و متن طبیعی review-first
- Voice to Text فقط روی دستگاه، بدون fallback ابری
- بررسی/نصب بسته گفتار فارسی در مرورگر سازگار
- مبلغ کوتاه `68م` و `۶۸ میلیون`
- عددهای گفتاری فارسی، شامل قیمت گفتاری و رقم های گفتاری تلفن
- تشخیص عنوان، فروشنده، موجودی، گارانتی، ارسال فردا و شماره
- استفاده دوباره از Seller Profile
- Draft محلی هفت روزه
- Progressive Disclosure فرم کامل Quote
- Guard جدید `check:quick-capture`
- Dexie v6 بدون migration
- Backup بدون تغییر
- Service Worker `besanj-shell-v16`
- بدون dependency جدید npm

## بررسی های اجراشده در محیط ساخت

- کل تست ها: **115/115 PASS**
- کل تست ها با `TZ=Asia/Tehran`: **115/115 PASS**
- `tests/quick-capture.test.ts`: **8/8 PASS**
- `tests/quote-capture.test.ts`: **4/4 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- `check:quick-capture`: **PASS**
- `check:purchase`: **PASS**
- `check:insights`: **PASS**
- `check:categories-budget`: **PASS**
- `check:sellers`: **PASS**
- `check:persian-ui`: **PASS**
- TS/TSX syntax parse: **146 فایل، 0 خطا**
- Local import resolution: **598 import، 0 مسیر شکسته**
- JavaScript syntax برای Service Worker و همه scriptهای `.mjs`: **PASS**
- LF normalization: **198 فایل متنی، 0 فایل CRLF**

## محدودیت محیط ساخت

Dependencyهای npm در محیط ساخت نصب نیستند. تست های Node و همه Guardهای مستقل اجرا و پاس شده اند، اما typecheck کامل پروژه، ESLint و Next production build باید روی سیستم مقصد با `npm install` و `npm run check` تأیید شوند.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm audit
npm run check
```

---

# QA | Besanj 1.4.0

## فاز تجربه بومی فارسی

- Mikhak FD به عنوان فونت اصلی رابط کاربری
- commit ثابت upstream برای فونت
- رقم فارسی صریح با `fa-IR-u-nu-arabext`
- تاریخ شمسی با `fa-IR-u-ca-persian-nu-arabext`
- تبدیل رقم Latin و Arabic-Indic به فارسی
- پوشش داشبورد، پرونده، فروشنده، بودجه، Insights، نمودار و گزارش
- حفظ RTL و تقویم Doran
- Service Worker `besanj-shell-v15` و cache فونت
- Guard جدید `check:persian-ui`
- Dexie v6 بدون migration
- بدون dependency جدید npm

## بررسی های اجراشده در محیط ساخت

- `npm test`: **107/107 PASS**
- `TZ=Asia/Tehran npm test`: **107/107 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- `check:purchase`: **PASS**
- `check:insights`: **PASS**
- `check:categories-budget`: **PASS**
- `check:sellers`: **PASS**
- `check:persian-ui`: **PASS**
- TS/TSX syntax/transpile: **138 فایل، 0 خطا**
- Local import resolution: **570 import، 0 مسیر شکسته**
- JavaScript syntax برای Service Worker و همه scriptهای `.mjs`: **PASS**
- LF normalization: **182 فایل متنی، 0 فایل CRLF**

## محدودیت محیط ساخت

Dependencyهای کامل npm داخل sandbox موجود نیستند. بنابراین `npm run check` کامل، TypeScript پروژه، ESLint و Next production build باید روی سیستم مقصد که `npm install` موفق دارد تأیید شوند.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA | Besanj 1.3.0

## فاز پروفایل سراسری فروشنده

- Seller Profile سراسری با شناسه پایدار
- مسیر `/sellers` و `/sellers/[id]`
- همه استعلام ها، خریدها و امتیازهای فروشنده در یک پروفایل
- شماره ها، وب سایت، اینستاگرام، تلگرام، واتساپ و یادداشت سراسری
- Favorite و علامت «پیشنهاد نمی شود»
- ویرایش سراسری نام و شماره اصلی
- Merge فروشنده های تکراری با حفظ Quote، Reminder و Purchase Outcome
- استفاده دوباره از فروشنده بر اساس `sellerProfileId`
- لینک Seller Memory در Insights به پروفایل سراسری
- Backup/Restore سازگار با Backupهای قدیمی
- Dexie schema v6 با store جدید `sellerProfiles`
- Service Worker `besanj-shell-v14`
- Guard جدید `check:sellers`
- Next.js و eslint-config-next روی `16.3.4` برای رفع گزارش امنیتی بحرانی مقصد

## بررسی های اجراشده در محیط ساخت

- `npm test`: **102/102 PASS**
- `TZ=Asia/Tehran npm test`: **102/102 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- `check:purchase`: **PASS**
- `check:insights`: **PASS**
- `check:categories-budget`: **PASS**
- `check:sellers`: **PASS**
- TS/TSX syntax/transpile: **137 فایل، 0 خطا**
- TypeScript strict check روی ماژول های pure جدید و مرتبط: **PASS**
- Local import resolution: **566 import، 0 مسیر شکسته**
- JavaScript syntax برای Service Worker و scriptهای `.mjs`: **PASS**
- LF normalization: **190 فایل متنی بررسی شد، 0 فایل CRLF**

## محدودیت محیط ساخت

`npm install` در sandbox به Registry دسترسی نداشت و dependencyهای پروژه داخل artifact مبنا نبودند. بنابراین اجرای معتبر `doctor`، typecheck کامل پروژه، ESLint و Next production build در این محیط ممکن نبود. TypeScript ماژول های pure مربوط به Seller Profile به صورت مستقل و strict بررسی شده است، اما گیت نهایی Release باید روی سیستم مقصد با dependencyهای نصب شده و `npm run check` تأیید شود.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA | Besanj 1.2.0

## فاز دسته بندی، برچسب و بودجه ماهانه

- دسته آماده و سفارشی برای پرونده
- چند برچسب آزاد با نرمال سازی و dedupe
- فیلتر Dashboard بر اساس دسته و برچسب
- بودجه کل ماه و سقف دسته ها
- محاسبه ماه جاری با تقویم فارسی و منطقه زمانی تهران
- هشدار ۸۰ درصد و عبور از سقف
- خلاصه بودجه Dashboard و تنظیمات `/insights#budget`
- فیلتر دسته و برچسب در Insights
- نمودار هزینه بر اساس دسته
- Backup/Restore کامل داده جدید
- Dexie schema v5 با store جدید `budgetPlans`
- Service Worker `besanj-shell-v13`
- Guard جدید `check:categories-budget`

## بررسی های اجراشده در محیط ساخت

- `npm test`: **92/92 PASS**
- `TZ=Asia/Tehran npm test`: **92/92 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- `check:purchase`: **PASS**
- `check:insights`: **PASS**
- `check:categories-budget`: **PASS**
- TS/TSX syntax/transpile: **129 فایل، 0 خطا**
- Local import resolution: **512 import، 0 مسیر شکسته**
- JavaScript syntax برای Service Worker و scriptهای `.mjs`: **PASS**

## محدودیت محیط ساخت

`npm install` در sandbox به Registry دسترسی شبکه ای نداشت. در نتیجه `doctor` وجود dependencyهای runtime را تایید نکرد و `typecheck`، ESLint و Next production build کامل در این محیط قابل اجرای معتبر نبودند. این سه مرحله باید روی سیستم مقصد با dependencyهای نصب شده اجرا شوند.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA — Besanj 1.1.0

## فاز بینش خرید و حافظه فروشنده

- صفحه `/insights` برای تحلیل داده خرید واقعی
- هزینه، صرفه‌جویی، بودجه، سرعت تصمیم و تحویل به‌موقع
- نمودار هزینه ماهانه
- حافظه فروشنده بین پرونده‌ها با نرمال‌سازی شماره/نام
- `.gitattributes` برای LF پایدار روی Windows
- `check:insights` guard

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **84/84 PASS**
- `TZ=Asia/Tehran npm test`: **84/84 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- `check:purchase`: **PASS**
- `check:insights`: **PASS**

Dependencyهای کامل npm داخل sandbox نصب نشده‌اند؛ بنابراین `tsc --noEmit`، ESLint و Next production build کامل باید روی سیستم مقصد با `npm run check` اجرا شوند.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA — Besanj 1.0.0

## فاز بستن حلقه خرید

- ثبت مبلغ واقعی و وضعیت سفارش/دریافت
- تاریخ خرید، مرجع سفارش، تحویل مورد انتظار، تاریخ دریافت و یادداشت
- مقایسه پرداخت واقعی با استعلام، بودجه و گران‌ترین گزینه
- قفل انتخاب نهایی بعد از ثبت خرید
- نتیجه خرید در کارت پرونده، گزارش و Timeline
- Delivery task در کارهای امروز و اعلان محلی
- Backup validation برای purchase outcome
- `check:purchase` guard

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **80/80 PASS**
- `TZ=Asia/Tehran npm test`: **80/80 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- `check:purchase`: **PASS**
- TypeScript syntax/transpile scan: **119 فایل TS/TSX، 0 خطای syntax**
- Local import resolution: **444 import محلی، 0 مسیر شکسته**
- Unused import candidate scan: **0 مورد**
- JavaScript syntax check برای Service Worker و scriptهای `.mjs`: **PASS**

Dependencyهای کامل npm داخل sandbox نصب نشدند؛ بنابراین `tsc --noEmit`، ESLint و Next production build کامل باید روی سیستم مقصد با `npm run check` اجرا شوند.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA — Besanj 0.9.0

## فاز ثبت سریع و استفاده از سابقه

- paste-to-form quote capture
- Persian/Arabic/Latin digit normalization
- Toman/Rial amount parsing
- delivery / warranty / payment / validity / channel suggestions
- review-first flow; no automatic save
- cross-case provider reuse with normalized deduplication
- `check:capture` guard

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **72/72 PASS**
- `TZ=Asia/Tehran npm test`: **72/72 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- `check:capture`: **PASS**
- TypeScript syntax/transpile scan: **115 فایل TS/TSX، 0 خطای syntax**
- Local import resolution: **412 import محلی، 0 مسیر شکسته**
- JavaScript syntax check برای Service Worker و scriptهای `.mjs`: **PASS**

Dependencyهای کامل npm داخل sandbox موجود نیستند؛ بنابراین `tsc --noEmit`، ESLint و Next production build کامل را باید روی سیستم مقصد با `npm run check` اجرا کرد.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

---

# QA — Besanj 0.8.0

## فاز اعلان و اقدام روزانه

- Web Notification permission/settings UI
- daily notification dedupe ledger
- service-worker notification click routing
- app badge + navbar task badge
- reminder snooze / done actions
- `check:automation` guard

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **67/67 PASS**
- `TZ=Asia/Tehran npm test`: **67/67 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- `check:automation`: **PASS**
- TypeScript syntax/transpile scan: **109 فایل TS/TSX، 0 خطای syntax**
- Local import resolution: **397 import محلی، 0 مسیر شکسته**
- Unused import candidate scan: **0 مورد**
- JavaScript syntax check برای Service Worker و scriptهای `.mjs`: **PASS**
- typecheck هدفمند برای `notifications/follow-up/quote/types`: **PASS**

Dependencyهای کامل npm داخل sandbox موجود نیستند؛ بنابراین `tsc --noEmit`، ESLint و Next production build کامل را باید روی سیستم مقصد با `npm run check` اجرا کرد.

## گیت مرجع روی سیستم مقصد

```bash
npm install
npm run check
```

برای regression تاریخ نیز:

```bash
TZ=Asia/Tehran npm test
```

---

# QA — Besanj 0.7.0

## مبنای شروع

نسخه 0.6.0 روی سیستم مقصد گیت کامل `npm run check` را پاس کرده بود: doctor، UI/theme/PWA/workflow/data guards، TypeScript، ESLint، 54 تست و Next production build.

## تغییرات فاز 0.7

- Quick contact روی کارت استعلام: call / SMS / WhatsApp / copy follow-up text.
- متن پیگیری بر اساس پرونده، فروشنده، آخرین قیمت و اعتبار قیمت.
- Case timeline با فیلتر رویداد.
- مسیر گزارش مستقل `/cases/[id]/report`.
- خلاصه قابل کپی و Web Share.
- Print stylesheet A4 و Save as PDF از دیالوگ چاپ مرورگر.
- نگهداری انتخاب نهایی تاریخی در گزارش حتی وقتی quote تازه‌تری برای همان فروشنده وجود دارد.
- Guard جدید `check:report`.
- Service Worker cache version: `besanj-shell-v8`.

## بررسی‌های اجراشده در محیط ساخت

- `npm test`: **61/61 PASS**
- `TZ=Asia/Tehran npm test`: **61/61 PASS**
- `check:ui`: **PASS**
- `check:theme`: **PASS**
- `check:pwa`: **PASS**
- `check:workflow`: **PASS**
- `check:data`: **PASS**
- `check:report`: **PASS**
- JavaScript syntax check برای Service Worker و تمام scriptهای `.mjs`: **PASS**
- TypeScript syntax/transpile scan: **104 فایل TS/TSX، 0 خطای syntax**
- Local import resolution: **378 import محلی، 0 مسیر شکسته** (CSS import مستثنا)
- Unused-import candidate scan روی فایل‌های جدید/تغییریافته: **0 مورد**

## محدودیت محیط ساخت

Dependencyهای npm داخل این sandbox نصب نیستند. بنابراین `tsc --noEmit`، `eslint` و `next build` کامل اینجا گیت نهایی محسوب نمی‌شوند. اجرای مرجع باید روی سیستم مقصد انجام شود:

```bash
npm install
npm run check
```

## Smoke test پیشنهادی

1. یک پرونده با شماره موبایل فروشنده باز کن؛ روی کارت قیمت باید تماس، واتساپ، پیامک و کپی متن قابل استفاده باشند.
2. فروشنده شماره ثابت داشته باشد؛ تماس نمایش داده شود ولی SMS و WhatsApp نمایش داده نشوند.
3. تب «رویدادها» را باز کن و فیلترهای استعلام/پیگیری/فایل/تصمیم را تست کن.
4. روی «گزارش» بزن؛ صفحه گزارش باید بودجه، شروط، قیمت‌ها و انتخاب نهایی را نشان دهد.
5. «کپی خلاصه» را تست کن.
6. روی دستگاهی که Web Share دارد، «اشتراک» را تست کن؛ روی مرورگر بدون Web Share باید متن کپی شود.
7. «چاپ / ذخیره PDF» را بزن و Preview را در Light و Dark Mode بررسی کن؛ خروجی چاپ باید پس‌زمینه سفید و A4 باشد.
8. اگر انتخاب نهایی quote قدیمی است و همان فروشنده quote جدید دارد، بخش «انتخاب نهایی» باید همچنان quote انتخاب‌شده قبلی را نشان دهد.

## v1.5.1 fix2: audit و TypeScript

- `canUseLocalWhisperRecorder` باید `getUserMedia` را با `typeof ... === "function"` بررسی کند تا TS2774 برنگردد.
- `@huggingface/transformers` نباید dependency npm پروژه باشد؛ browser runtime نسخه 4.2.0 از loader ثابت بارگذاری می شود.
- بعد از جایگزینی fix2 روی branch قبلی، `npm install` باید dependencyهای Node-only نسخه اولیه را حذف کند و سپس `npm audit` دوباره بررسی شود.

## v1.5.1 fix5: Tooltip سراسری

- Tooltip رسمی PersianLabs/ui باید از Base UI primitive و DirectionProvider استفاده کند.
- Tooltip باید بالاتر از ResponsiveSheet دیده شود و در RTL جهت درست داشته باشد.
- `ResponsiveSheet.description` و `FormField.hint` باید به HelpHint منتقل شوند.
- راهنماهای غیرحیاتی در صفحات اصلی، ثبت سریع، Voice، بودجه، Backup، فروشنده ها، Insights، Timeline، نمودار و Decision Assistant باید از HelpHint استفاده کنند.
- خطاها و هشدارهای حیاتی نباید داخل Tooltip پنهان شوند.
- `check:tooltips` باید PASS شود.
- regression الزامی: `npm audit` و `npm run check`.


### نتیجه ساخت fix5 در این محیط

- مبنای fix4 روی سیستم مقصد: `124/124` تست PASS، TypeScript PASS، ESLint PASS و Next production build PASS.
- تمام Guardهای مستقل از dependency در fix5: PASS.
- `check:tooltips`: PASS، استفاده در ۱۸ سطح کلیدی رابط.
- TS/TSX syntax scan: ۱۵۲ فایل، ۰ خطا.
- Local import resolution: ۶۳۷ import، ۰ مسیر شکسته.
- نصب dependency در محیط ساخت در زمان مجاز کامل نشد؛ بنابراین full `typecheck/lint/test/build` این fix باید یک بار روی سیستم مقصد با `npm run check` اجرا شود.

# QA - Besanj 1.6.0

## Templates

- ۸ قالب آماده باید در Sheet قالب ها دیده شوند و هم کالا و هم خدمت را پوشش دهند.
- جست وجو باید نام، دسته، برچسب و شرط های قالب را پیدا کند.
- انتخاب قالب باید Create Case را با عنوان، نوع، دسته، برچسب، شرط ها، توضیح و بودجه موجود در قالب پر کند، اما قبل از ساخت همه فیلدها قابل ویرایش باشند.
- ساخت پرونده از قالب شخصی باید `useCount` و `lastUsedAt` را فقط بعد از ساخت موفق به روز کند.
- «ذخیره قالب» داخل پرونده نباید فروشنده، Quote، Reminder، Attachment یا انتخاب نهایی را وارد قالب کند.
- بودجه هنگام ذخیره قالب شخصی به صورت پیش فرض خاموش باشد و فقط با انتخاب صریح کاربر ذخیره شود.
- قالب شخصی باید favorite، حذف دو مرحله ای و مرتب سازی بر اساس favorite/usage داشته باشد.
- روی موبایل دکمه «قالب ها» کنار «ثبت سریع» در دسترس باشد.

## Data migration and backup

- Dexie v7 باید جدول `caseTemplates` را بدون دست زدن به شناسه یا محتوای جدول های قبلی ایجاد کند.
- Backup جدید باید قالب های شخصی را صادر و بازیابی کند.
- Backup قدیمی بدون `caseTemplates` باید همچنان پذیرفته شود.
- Built-in templateها داخل Backup ذخیره نشوند، چون بخشی از نسخه برنامه هستند.

## Quality gate

- `check:templates`: PASS
- همه Guardهای قبلی: PASS
- تست های pure در محیط ساخت: **132/132 PASS**
- TypeScript/TSX syntax scan: **155 فایل، 0 خطا**
- Local import resolution: **667 import، 0 مسیر شکسته**
- `npm audit` و full `npm run check` باید روی سیستم مقصد اجرا شوند.

## Smoke test

1. از داشبورد «قالب ها» را باز کن و قالب موبایل را انتخاب کن.
2. قبل از ساخت، عنوان را تغییر بده و شرط های آماده را ببین.
3. پرونده را بساز و مطمئن شو هیچ فروشنده یا قیمتی خودکار ایجاد نشده است.
4. یک پرونده موجود را با «ذخیره قالب» به قالب شخصی تبدیل کن.
5. همان قالب را از تب شخصی دوباره استفاده کن.
6. favorite و حذف دو مرحله ای را تست کن.
7. Backup بگیر، قالب شخصی را حذف کن، Backup را Restore کن و برگشت قالب را بررسی کن.


# QA - Besanj 1.7.0

## هوش قیمت پرونده

- با کمتر از سه روز سابقه، نتیجه باید «داده کم» باشد و توصیه قیمتی قطعی نمایش داده نشود.
- snapshot روزانه باید کمترین قیمت هر روز باشد و چند استعلام همان روز نباید وزن آماری مصنوعی بسازند.
- بهترین قیمت فعلی باید از آخرین قیمت هر فروشنده گرفته شود.
- قیمت در کف سابقه یا به شکل محسوسی پایین تر از میانه فقط وقتی fresh است «در کف سابقه» یا «مناسب» شود.
- stale و expired باید نتیجه قیمتی مثبت را override کنند و کاربر را به استعلام تازه هدایت کنند.
- روند اخیر باید با حداقل چهار snapshot قابل محاسبه باشد.
- سطح اطمینان باید با تعداد snapshot و فروشنده افزایش پیدا کند.

## Insights

- «هوش قیمت شخصی» باید حتی بدون Purchase Outcome نمایش داده شود.
- دسته و برچسب فعلی Insights باید روی محاسبات Price Intelligence هم اعمال شوند.
- بهترین فرصت فقط از پرونده فعال، fresh، با سابقه کافی و سیگنال مناسب انتخاب شود.
- پرونده های stale یا داده کم نباید داخل آمار فرصت های قابل ارزیابی حساب شوند.

## Seller Price Memory

- مقایسه فروشنده باید درون همان پرونده با ارزان ترین قیمت همان پرونده normalize شود.
- حداقل دو فروشنده در پرونده برای قابل مقایسه شدن آن پرونده لازم است.
- حداقل دو پرونده قابل مقایسه برای برچسب نهایی «اغلب رقابتی»، «معمولاً نزدیک بازار شخصی» یا «اغلب گران تر» لازم است.
- صفحه Seller باید تعداد پرونده قابل مقایسه، فاصله معمول از ارزان ترین و دفعات ارزان ترین بودن را نشان دهد.

## Privacy / regression

- `lib/price-intelligence.ts` و سه component مربوط به آن نباید fetch، API key یا endpoint قیمت بیرونی داشته باشند.
- Dexie باید v7 باقی بماند و migration جدیدی ایجاد نشود.
- Backup schema باید backward-compatible باقی بماند؛ فقط appVersion جدید مجاز است.
- Templates، Voice، Tooltip، PWA، Seller Profiles، Purchase Outcome و Insights قبلی نباید regression داشته باشند.

## Quality gate

- `check:price-intelligence`: PASS در محیط ساخت.
- تست های جدید Price Intelligence: **10/10 PASS** در محیط ساخت.
- full `npm test`: باید تعداد تست های قبلی 132 را با 10 تست جدید به **142 تست** برساند.
- `npm audit` و full `npm run check` باید روی سیستم مقصد اجرا شوند.

## Smoke test

1. سه روز قیمت برای یک پرونده ثبت کن و روز آخر را ارزان تر کن.
2. کارت هوش قیمت را در صفحه پرونده بررسی کن.
3. یک قیمت قدیمی بساز و مطمئن شو سیگنال stale می شود.
4. بخش هوش قیمت را در Insights با فیلتر دسته و برچسب بررسی کن.
5. فروشنده ای با دو پرونده رقابتی و دو رقیب بساز و جایگاه قیمتی Seller را بررسی کن.
6. همان فروشنده را در هر دو پرونده گران تر ثبت کن و تغییر برچسب را ببین.
7. `npm audit` و `npm run check` را اجرا کن.

### نتیجه ساخت v1.7.0 در این محیط

- تمام Guardهای مستقل از dependency: **PASS**.
- `check:price-intelligence`: **PASS**.
- `npm test`: **142/142 PASS**.
- `TZ=Asia/Tehran npm test`: **142/142 PASS**.
- تست های Price Intelligence: **10/10 PASS**.
- TS/TSX syntax scan: **160 فایل، 0 خطا**.
- Local import resolution: **700 import، 0 مسیر شکسته**.
- JavaScript syntax check برای Service Worker و تمام scriptهای `.mjs`: **PASS**.
- LF scan: **209 فایل متنی، 0 CRLF**.
- تلاش برای `npm install` در sandbox به محدودیت شبکه/زمان خورد؛ بنابراین `doctor`, full `typecheck`, `eslint` و `next build` نهایی باید روی سیستم مقصد با `npm install && npm audit && npm run check` اجرا شوند.
