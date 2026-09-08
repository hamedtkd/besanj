# بسنج | Besanj

بسنج یک وب اپ فارسی، local-first و بدون Backend برای مدیریت تصمیم خرید است. کاربر برای یک کالا یا خدمت پرونده می سازد، از چند فروشنده استعلام می گیرد، قیمت و شرایط را نگه می دارد، گزینه ها را مقایسه می کند، پیگیری انجام می دهد، خرید واقعی و تحویل را ثبت می کند و بعد از داده خریدهای قبلی برای تصمیم های بعدی استفاده می کند.

نسخه فعلی: **1.2.0**

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

Schema فعلی Dexie: **v5**

جدول ها:

```text
purchaseCases
providers
quotes
reminders
attachments
budgetPlans
```

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
theme / palette preferences
```

دسته و برچسب داخل رکوردهای `purchaseCases` ذخیره می شوند. تنظیم بودجه داخل `budgetPlans` قرار دارد.

فرمت فایل Backup همچنان نسخه 1 باقی مانده است، چون فیلد جدید optional است و parser نسخه 1.2 فایل های قدیمی فاقد `budgetPlans` را هم می پذیرد.

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
check:purchase
check:insights
check:categories-budget
typecheck
lint
test
build
```

`check:categories-budget` فقط وجود فایل را بررسی نمی کند. این Guard سیم کشی واقعی مدل داده، migration v5، فرم ایجاد و ویرایش پرونده، فیلترها، محاسبه بودجه، Insights و Backup/Restore را کنترل می کند.

## PWA

Service Worker در production ثبت می شود. cache فعلی:

```text
besanj-shell-v13
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

## توسعه نسخه 1.2

Branch پیشنهادی و فعلی این Release:

```text
feat/categories-budget-v1.2
```

بعد از جایگزینی سورس:

```bash
npm install
npm run check
```

اگر همه چیز سبز بود:

```bash
git add .
git commit -m "feat: add Besanj categories tags and monthly budgets v1.2.0"
```

Merge و Tag فقط بعد از سبزشدن کامل روی سیستم مقصد انجام شود.

## منابع پروژه

- `THIRD_PARTY.md`: کتابخانه ها و مجوزها.
- `QA.md`: وضعیت QA نسخه ها.
- `docs/RELEASE_1.2.0.md`: Release Note نسخه فعلی.
