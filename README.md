# بسنج | Besanj

بسنج یک وب اپ فارسی و local-first برای مدیریت تصمیم خرید است. داده های اصلی خرید، فروشنده، استعلام، بودجه و تاریخچه همچنان روی دستگاه کاربر می مانند. تنها قابلیت اختیاری «گفتار با هوش مصنوعی» یک route سروری کوچک دارد که فقط صدای همان ضبط را برای تبدیل به متن به Groq می فرستد.

نسخه فعلی: **1.5.1**

## نسخه 1.5.1: گفتار دقیق تر با هوش مصنوعی و حالت محلی

به دلیل دقت پایین Whisper Tiny روی بعضی دستگاه ها و واژه های فارسی مثل نام برند و مدل کالا، مسیر اصلی Voice در ثبت سریع به Groq Whisper Large V3 منتقل شده است. حالت محلی حذف نشده و برای کاربری که نمی خواهد صدا از دستگاه خارج شود همچنان در دسترس است.

- دکمه اصلی Voice: «با هوش مصنوعی بگو».
- سرویس گفتار: Groq Speech-to-Text با مدل پیش فرض `whisper-large-v3`.
- زبان ورودی به صورت صریح `fa` ارسال می شود.
- یک prompt کوتاه مخصوص استعلام خرید به مدل داده می شود تا نام برند و مدل، قیمت، گارانتی، موجودی، تحویل و شماره تلفن دقیق تر رونویسی شوند.
- API key فقط در متغیر سروری `GROQ_API_KEY` خوانده می شود و هیچ `NEXT_PUBLIC` برای کلید وجود ندارد.
- Browser صدا را فقط به route داخلی `/api/transcribe` می فرستد و route سرور درخواست را به Groq منتقل می کند.
- پاسخ route با `no-store` برمی گردد و خود بسنج فایل صوتی را در دیتابیس یا Backup ذخیره نمی کند.
- متن برگشتی همچنان وارد parser محلی ثبت سریع می شود و قبل از ذخیره به کاربر نشان داده می شود.
- حالت «تشخیص محلی» همچنان `SpeechRecognition.processLocally = true` و در صورت نیاز Whisper Tiny داخل مرورگر را دارد.
- dependency npm جدید برای Groq یا Transformers اضافه نشده است و `fetch` سمت سرور استفاده می شود.
- Guard جدید: `check:cloud-voice`.
- Guard محلی `check:voice-fallback` نیز باقی مانده است.
- Service Worker cache version همچنان `besanj-shell-v18`.
- Dexie و Backup بدون تغییر.

### تنظیم کلید Groq

فایل `.env.local` را در ریشه پروژه بساز و مقدار زیر را قرار بده:

```env
GROQ_API_KEY=کلید_خودت
GROQ_TRANSCRIBE_MODEL=whisper-large-v3
```

کلید را داخل Git commit نکن. نمونه امن تنظیمات در `.env.example` وجود دارد. بعد از ساخت یا تغییر `.env.local`، dev server را یک بار متوقف و دوباره اجرا کن.

## فاز 1.5: ثبت سریع و ورود طبیعی اطلاعات

این نسخه اصطکاک ثبت اطلاعات را کم می کند. کاربر می تواند با یک عنوان کوتاه پرونده بسازد، متن فروشنده را Paste کند یا در مرورگرهای سازگار با تشخیص گفتار محلی، اطلاعات را با صدا بگوید و قبل از ثبت نتیجه استخراج شده را مرور کند.

- ورودی «ثبت سریع» در داشبورد روی دسکتاپ و موبایل.
- ساخت پرونده فقط با عنوان، با دسته پیش فرض «سایر» و تکمیل جزئیات در آینده.
- ثبت استعلام برای پرونده موجود یا ساخت پرونده و استعلام در یک مرحله.
- parser محلی برای عنوان کالا/خدمت، قیمت، شماره فروشنده، گارانتی، موجودی، ارسال/تحویل، اعتبار و کانال تماس.
- پشتیبانی از مبلغ های کوتاه مثل `68م`، `۶۸ میلیون` و عدد کامل.
- فهم عددهای گفتاری فارسی مثل «شصت و هشت میلیون».
- تشخیص «ارسال فردا»، «تحویل فوری»، «موجود» و «ناموجود».
- انتخاب فروشنده سراسری قبلی بدون تایپ دوباره.
- مسیر «قیمت جدید» روی کارت فروشنده، با حفظ فروشنده و تاریخچه و تمرکز روی وارد کردن مبلغ تازه.
- Voice to Text فقط با `SpeechRecognition.processLocally = true` و بدون fallback ابری.
- بررسی و نصب بسته گفتار فارسی روی دستگاه فقط در مرورگرهایی که API محلی را پشتیبانی می کنند.
- Draft محلی هفت روزه برای ثبت نیمه کاره.
- فرم عادی استعلام با «جزئیات بیشتر، اختیاری» تا فیلدهای کم استفاده مزاحم ثبت سریع نباشند.
- همه خروجی های پیشنهادی review-first هستند و چیزی بدون تأیید کاربر ذخیره نمی شود.
- Dexie همچنان v6 و بدون migration جدید.
- بدون dependency جدید npm.
- Guard جدید `check:quick-capture`.
- Service Worker cache version: `besanj-shell-v16`.

## فاز 1.4: تجربه بومی فارسی

این نسخه ظاهر فارسی بسنج را یکپارچه می کند، بدون تغییر در مدل داده یا جریان خرید.

- فونت اصلی کل برنامه: Mikhak.
- استفاده از variant مخصوص رقم فارسی `Mikhak-FD`.
- پین فونت به commit ثابت upstream برای جلوگیری از تغییر ناگهانی فایل.
- وزن متغیر 100 تا 900 در همان فایل فونت.
- رقم فارسی اجباری در NumberFormat، toLocaleString، درصد، تعداد، قیمت و نمودارها.
- تبدیل رقم لاتین و Arabic-Indic به رقم فارسی در متن های نمایشی.
- تاریخ شمسی با numbering system فارسی.
- حفظ `lang="fa"` و `dir="rtl"` در ریشه برنامه.
- Mikhak برای Recharts و گزارش چاپی.
- Service Worker `besanj-shell-v15` با cache فایل فونت.
- Guard جدید `check:persian-ui`.
- Dexie همچنان v6 و بدون migration جدید.
- بدون dependency جدید npm.

## فاز 1.3: پروفایل سراسری فروشنده

این نسخه حافظه فروشنده را از یک تجمیع آماری به یک موجودیت واقعی و قابل مدیریت تبدیل می کند. همه چیز همچنان local-first است و هیچ داده ای به Backend یا سرویس خارجی ارسال نمی شود.

- مسیر `/sellers` برای فهرست سراسری فروشنده ها.
- مسیر `/sellers/[id]` برای پروفایل اختصاصی هر فروشنده.
- شناسه پایدار فروشنده در همه پرونده ها با `sellerProfileId`.
- سابقه همه استعلام ها، خریدها و امتیازها در یک صفحه.
- آمار تعداد پرونده، استعلام، خرید، نرخ انتخاب، میانگین قیمت و مجموع خرید.
- سابقه تحویل به موقع و میانگین امتیاز فروشنده.
- شماره اصلی، شماره های دیگر، وب سایت، اینستاگرام، تلگرام و واتساپ.
- یادداشت سراسری فروشنده.
- علامت «محبوب» و «پیشنهاد نمی شود» با نمایش در فهرست و مقایسه استعلام ها.
- ویرایش نام و شماره اصلی به صورت سراسری روی تمام Providerهای مرتبط.
- ادغام دو پروفایل تکراری بدون حذف استعلام، خرید یا پیگیری.
- استفاده دوباره از فروشنده قبلی بر اساس شناسه پایدار، نه فقط شباهت متن.
- لینک مستقیم Seller Memory در Insights به پروفایل سراسری.
- Backup/Restore کامل Seller Profile و سازگاری با Backupهای قدیمی.
- Migration خودکار Dexie از v5 به v6.
- Guard جدید `check:sellers`.
- Service Worker cache version: `besanj-shell-v14`.

## فاز 1.2: دسته بندی، برچسب و بودجه ماهانه

این نسخه یک لایه مدیریت هزینه روی چرخه خرید موجود اضافه می کند، بدون AI و بدون ارسال اطلاعات به سرویس بیرونی.

- دسته بندی برای هر پرونده با گزینه های آماده: لوازم خانگی، دیجیتال، درمان، خودرو، خدمات، خانه، سفر و سایر.
- دسته سفارشی برای نیازهای شخصی کاربر.
- چند برچسب آزاد برای هر پرونده، مثل ضروری، کاری، شخصی، تعمیر و هدیه.
- نمایش دسته و برچسب روی کارت پرونده، صفحه پرونده و گزارش.
- فیلتر داشبورد بر اساس دسته و برچسب.
- جست وجوی داشبورد در عنوان، توضیح، دسته، برچسب و شرط های خرید.
- بودجه کل ماه و بودجه جدا برای دسته ها.
- محاسبه مصرف بودجه از مبلغ واقعی خریدهای ثبت شده در ماه جاری شمسی.
- نمایش مبلغ مصرف شده، مبلغ باقی مانده و وضعیت نزدیک سقف یا عبور از سقف.
- آستانه هشدار نزدیک سقف: ۸۰ درصد.
- خلاصه بودجه در داشبورد.
- بخش بودجه در صفحه `/insights`.
- فیلتر Insights بر اساس دسته و برچسب.
- نمودار هزینه واقعی بر اساس دسته.
- Backup/Restore کامل دسته ها، برچسب ها و بودجه ها.
- Guard جدید `check:categories-budget`.
- Service Worker cache version: `besanj-shell-v13`.

## فاز 1.1: بینش خرید و حافظه فروشنده

- مسیر `/insights` برای تحلیل خریدهای تکمیل شده.
- مجموع هزینه واقعی، صرفه جویی، وضعیت بودجه هدف، سرعت تصمیم و تحویل به موقع.
- نمودار هزینه ماهانه تا ۱۲ ماه اخیر.
- حافظه فروشنده بین پرونده ها با نرمال سازی شماره و نام.
- تعداد استعلام، تعداد خرید، مجموع خرید، میانگین امتیاز و سابقه تحویل فروشنده.
- برجسته سازی بیشترین صرفه جویی، بیشترین عبور از بودجه و فروشنده پرتکرار.
- `.gitattributes` برای LF پایدار روی Windows.
- Guard `check:insights`.

## فاز 1.0: بستن حلقه خرید

- ثبت مبلغ واقعی پرداخت شده.
- ثبت تاریخ خرید، شماره سفارش یا رسید، موعد تحویل، تاریخ دریافت و یادداشت نتیجه.
- وضعیت سفارش ثبت شده و دریافت شده.
- مقایسه مبلغ واقعی با استعلام، بودجه هدف و گران ترین گزینه.
- قفل ایمنی روی استعلام خریدشده تا نتیجه خرید پاک یا ویرایش شود.
- نمایش نتیجه خرید در کارت، پرونده، گزارش و Timeline.
- Delivery Task و اعلان محلی موعد تحویل.
- Backup validation برای نتیجه خرید.
- Guard `check:purchase`.

## قابلیت های قبلی

- پرونده خرید یا خدمت.
- چند فروشنده و چند استعلام برای هر پرونده.
- قیمت، هزینه جانبی، تاریخ استعلام، اعتبار قیمت، تحویل، گارانتی، شرایط پرداخت و یادداشت.
- کانال تماس شامل تلفن، واتساپ، اینستاگرام، تلگرام، وب، حضوری و موارد دیگر.
- مقایسه حداکثر چهار گزینه کنار هم.
- تاریخچه قیمت و تاریخچه فروشنده.
- Decision Assistant با قواعد شفاف.
- بودجه هدف برای هر پرونده.
- Requirement و میزان پوشش آن روی استعلام.
- امتیاز فروشنده.
- Reminder، Follow-up و Snooze.
- Attachment.
- کارهای امروز.
- Backup/Restore کامل.
- خرید مشابه و استفاده دوباره از فروشنده قبلی.
- Report، Timeline، Share و Print/PDF از مرورگر.
- اعلان های local-first، App Badge و Daily Notification Ledger.
- ثبت سریع استعلام از متن با parser محلی و review-first.
- Purchase Outcome و تحویل.
- Purchase Insights و Seller Memory.

## اصول محصول

- local-first.
- بدون Login و Backend در نسخه فعلی.
- قابلیت های اصلی deterministic هستند.
- داده کاربر برای AI یا سرویس خارجی ارسال نمی شود.
- PWA قابل نصب است.
- اطلاعات اصلی در IndexedDB با Dexie ذخیره می شوند.

## رابط فارسی

- `lang="fa"` و `dir="rtl"` از ریشه برنامه.
- اعداد نمایشی فارسی.
- Light، Dark و System Theme.
- Custom Primary Color و تغییر سریع Theme از Navbar.
- کنترل های عمومی بر پایه PersianLabs UI و wrapperهای موجود پروژه.
- Select بومی مرورگر استفاده نمی شود.
- Date Picker شمسی با Doran.
- Sheet موبایل با رفتار مناسب drag و dismiss.
- متن `null` و sentinelهای مشابه در UI نمایش داده نمی شوند.
- مبلغ ها با آیکن تومان پروژه نمایش داده می شوند.

## داده و Migration

نام دیتابیس برای حفظ اطلاعات نسخه های قبلی تغییر نکرده است:

```text
estelamkoo-local
```

Schema فعلی Dexie: **v6**

جدول ها:

```text
purchaseCases
providers
quotes
reminders
attachments
budgetPlans
sellerProfiles
```

### Migration v6

در v1.3 یک store سراسری به نام `sellerProfiles` اضافه شده است. ردیف `Provider` همچنان رابطه فروشنده با یک پرونده را نگه می دارد، اما با `sellerProfileId` به هویت سراسری فروشنده وصل می شود. این ساختار باعث می شود Quote، Reminder، Rating و سابقه پرونده های قبلی بدون بازنویسی مخرب باقی بمانند.

Migration از v5 به v6 backward-compatible است:

- store جدید `sellerProfiles` ساخته می شود.
- Providerهای موجود با نرمال سازی شماره تلفن و در نبود شماره با نام نرمال شده، به پروفایل سراسری وصل می شوند.
- شناسه Quoteها، Providerها، Reminderها، خریدها و Attachmentها تغییر نمی کند.
- امتیازهای قبلی حفظ می شوند و زمان آخرین امتیاز از داده موجود مقدار اولیه می گیرد.
- نام دیتابیس همچنان `estelamkoo-local` است.
- هیچ فروشنده یا استعلام قبلی حذف نمی شود.

### مدل فروشنده

`SellerProfile` هویت سراسری فروشنده را نگه می دارد و `Provider` رابطه همان فروشنده با یک پرونده مشخص است. ویرایش نام یا شماره اصلی Seller Profile روی Providerهای مرتبط همگام می شود، ولی Quoteها و امتیازهای تاریخی در جای خود باقی می مانند.

در زمان ادغام، پروفایل مقصد باقی می ماند. اگر هر دو پروفایل در یک پرونده Provider جدا داشته باشند، Quoteها و Reminderها به یک Provider واحد منتقل می شوند و سپس Provider تکراری حذف می شود.

### Migration v5

فاز 1.2 اولین فاز بعد از v0.5 است که به store جدید نیاز دارد. دلیل آن نگهداری تنظیم بودجه ماهانه و سقف دسته ها مستقل از یک پرونده خاص است.

Migration از v4 به v5 backward-compatible است:

- store جدید `budgetPlans` ساخته می شود.
- رکوردهای قدیمی پرونده حذف یا بازنویسی مخرب نمی شوند.
- دسته و برچسب پرونده های قدیمی اختیاری هستند.
- دسته و برچسب موجود هنگام migration نرمال می شوند.
- نام دیتابیس ثابت می ماند.

## مدل دسته بندی

دسته های آماده شناسه پایدار داخلی دارند و متن فارسی به کاربر نمایش داده می شود. دسته سفارشی با یک کلید deterministic بر اساس نام نرمال شده ذخیره می شود.

هر پرونده می تواند حداکثر ۸ برچسب داشته باشد. برچسب های تکراری با نرمال سازی فارسی حذف می شوند.

## بودجه ماهانه

تنظیم بودجه در store `budgetPlans` با شناسه ثابت `monthly` ذخیره می شود.

بودجه می تواند شامل این موارد باشد:

```text
monthlyLimitToman
categoryLimits
updatedAt
```

مصرف بودجه از `purchaseOutcome.actualPaidToman` محاسبه می شود، نه از قیمت خام استعلام. بنابراین فقط خرید واقعی ثبت شده روی هزینه ماه اثر می گذارد.

مرز ماه بر اساس تقویم فارسی و منطقه زمانی `Asia/Tehran` محاسبه می شود. اطلاعات خریدهای ماه های قبلی پاک نمی شوند، فقط Snapshot ماه جاری از داده موجود ساخته می شود.

وضعیت بودجه:

```text
safe: کمتر از ۸۰ درصد
near: از ۸۰ درصد تا سقف
 over: بیشتر از سقف
none: سقف تعیین نشده
```

## پشتیبان کامل

Settings > پشتیبان و انتقال داده

Backup شامل این موارد است:

```text
purchaseCases
providers
quotes
reminders
attachments
budgetPlans
sellerProfiles
theme / palette preferences
```

دسته و برچسب داخل رکوردهای `purchaseCases` ذخیره می شوند. تنظیم بودجه داخل `budgetPlans` قرار دارد. هویت سراسری فروشنده داخل `sellerProfiles` ذخیره می شود و `providers.sellerProfileId` ارتباط آن با پرونده ها را نگه می دارد.

فرمت فایل Backup همچنان نسخه 1 باقی مانده است، چون داده های جدید افزایشی هستند. Parser نسخه 1.3 فایل های قدیمی فاقد `budgetPlans` یا `sellerProfiles` را هم می پذیرد. هنگام Restore یک Backup قدیمی، Seller Profileها از Providerهای موجود ساخته می شوند.

Restore به صورت جایگزینی کامل انجام می شود و پیش از تغییر دیتابیس، ساختار داده اعتبارسنجی می شود.

## خرید مشابه

خرید مشابه دسته و برچسب پرونده مبنا را هم به پرونده تازه منتقل می کند. قیمت ها، انتخاب نهایی، نتیجه خرید، Reminderها و Attachmentها به پرونده جدید منتقل نمی شوند.

## محدودیت پیوست

- حداکثر ۵ فایل برای هر استعلام.
- حداکثر ۸ مگابایت برای هر فایل.
- حداکثر ۲۴ مگابایت مجموع فایل های یک استعلام.
- تصویر، PDF، Word، Excel و فایل متنی پشتیبانی می شوند.

## نصب و اجرا

نسخه پیشنهادی Node در `.nvmrc` ثبت شده است.

```bash
npm install
npm run dev
```

برای تست نسخه Production:

```bash
npm run build
npm start
```

## کنترل کیفیت

گیت کامل پروژه:

```bash
npm run check
```

ترتیب فعلی:

```text
doctor
check:ui
check:theme
check:pwa
check:workflow
check:data
check:report
check:automation
check:capture
check:quick-capture
check:voice-fallback
check:purchase
check:insights
check:categories-budget
check:sellers
check:tooltips
typecheck
lint
test
build
```

`check:categories-budget` سیم کشی دسته، بودجه و گزارش را کنترل می کند. `check:sellers` نیز فقط وجود فایل را بررسی نمی کند و migration v6، هویت پایدار فروشنده، مسیرهای Seller، ادغام، ویرایش سراسری، استفاده دوباره در Quote، Insights و Backup/Restore را بررسی می کند.

## PWA

Service Worker در production ثبت می شود. cache فعلی:

```text
besanj-shell-v18
```

## فایل های مهم نسخه 1.5.1

```text
components/local-voice-capture.tsx
components/ui/tooltip.tsx
components/help-hint.tsx
scripts/check-tooltips.mjs
lib/local-whisper.ts
lib/local-speech.ts
scripts/check-voice-fallback.mjs
tests/local-whisper.test.ts
docs/RELEASE_1.5.1.md
next.config.ts
```

## فایل های مهم فاز 1.5

```text
components/quick-capture-sheet.tsx
components/local-voice-capture.tsx
components/quote-capture-panel.tsx
components/quote-form-dialog.tsx
components/home-screen.tsx
lib/quick-capture.ts
lib/local-speech.ts
lib/spoken-persian-number.ts
lib/quote-capture.ts
scripts/check-quick-capture.mjs
tests/quick-capture.test.ts
docs/RELEASE_1.5.0.md
```

## فایل های مهم فاز 1.3

```text
lib/seller-profiles.ts
lib/db.ts
lib/provider-history.ts
lib/insights.ts
lib/backup-format.ts
components/seller-directory-page.tsx
components/seller-profile-page.tsx
components/seller-profile-edit-sheet.tsx
components/seller-merge-sheet.tsx
components/quote-form-dialog.tsx
components/quote-comparison.tsx
app/sellers/page.tsx
app/sellers/[id]/page.tsx
scripts/check-seller-profiles.mjs
tests/seller-profiles.test.ts
docs/RELEASE_1.3.0.md
```

## فایل های مهم فاز 1.2

```text
lib/categories.ts
lib/budget.ts
lib/db.ts
lib/insights.ts
lib/backup-format.ts
components/budget-settings-sheet.tsx
components/monthly-budget-summary.tsx
components/budget-overview.tsx
components/create-case-dialog.tsx
components/case-planning-sheet.tsx
components/home-screen.tsx
components/insights-page.tsx
scripts/check-categories-budget.mjs
tests/categories-budget.test.ts
docs/RELEASE_1.2.0.md
```

## قانون UI

قبل از ساخت کنترل عمومی جدید، PersianLabs UI و wrapperهای فعلی پروژه بررسی می شوند. Date Picker پروژه از Doran برای تقویم فارسی استفاده می کند. تغییر component پایه باید بدون regression در همه مصرف کننده ها انجام شود.


### راهنمای سراسری UI

از v1.5.1 fix5، متن های توضیحی غیرحیاتی با `HelpHint` و Tooltip رسمی PersianLabs/ui نمایش داده می شوند. `ResponsiveSheet.description` و `FormField.hint` این رفتار را به صورت مرکزی اعمال می کنند. خطاها، هشدارهای destructive و پیام های وضعیت مهم همچنان مستقیم روی صفحه می مانند.

## توسعه نسخه 1.5.1

Branch پیشنهادی این Patch:

```text
fix/local-whisper-v1.5.1
```

بعد از جایگزینی سورس:

```bash
npm install
npm run check
```

اگر همه چیز سبز بود:

```bash
git add .
git commit -m "fix: add cached local Whisper fallback v1.5.1"
```

Merge و Tag فقط بعد از سبزشدن کامل روی سیستم مقصد انجام شود.

## منابع پروژه

- `THIRD_PARTY.md`: کتابخانه ها و مجوزها.
- `QA.md`: وضعیت QA نسخه ها.
- `docs/RELEASE_1.5.1.md`: Release Note نسخه فعلی.
