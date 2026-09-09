# Besanj 1.3.0

## موضوع Release

پروفایل سراسری فروشنده و حافظه قابل مدیریت فروشنده ها.

تا نسخه 1.2، فروشنده در هر پرونده یک `Provider` مستقل بود و Insights فقط با نرمال سازی نام و شماره، سابقه فروشنده های مشابه را کنار هم نشان می داد. در 1.3 هویت فروشنده به یک مدل پایدار و سراسری تبدیل شده است، بدون اینکه ساختار Quote، Reminder یا سابقه پرونده های قبلی شکسته شود.

## قابلیت های جدید

- مسیر `/sellers` برای فهرست همه فروشنده ها.
- مسیر `/sellers/[id]` برای پروفایل اختصاصی فروشنده.
- جست وجو بر اساس نام، شماره و راه های ارتباطی.
- فیلتر فروشنده های محبوب و فروشنده های دارای علامت «پیشنهاد نمی شود».
- نمایش تعداد پرونده، استعلام و خرید برای هر فروشنده.
- نمایش مجموع خرید واقعی، میانگین قیمت استعلام و میانگین مبلغ خرید.
- نرخ انتخاب فروشنده در پرونده ها.
- میانگین امتیاز و تاریخچه امتیاز بر اساس پرونده.
- سابقه تحویل به موقع برای خریدهایی که موعد و دریافت ثبت شده دارند.
- تاریخچه کامل همه استعلام ها و خریدهای فروشنده در پرونده های مختلف.
- شماره اصلی و حداکثر ۸ شماره دیگر.
- وب سایت، اینستاگرام، تلگرام و واتساپ.
- یادداشت سراسری فروشنده.
- علامت Favorite با عنوان فارسی «محبوب».
- علامت Avoid با عنوان فارسی «پیشنهاد نمی شود».
- Favorite و Avoid هم زمان فعال نمی شوند.
- وضعیت محبوب یا پیشنهادنشدن روی کارت های مقایسه استعلام هم دیده می شود.
- لینک پروفایل فروشنده در صفحه پرونده و Quote Comparison.
- Seller Memory در Insights در صورت وجود شناسه پایدار به پروفایل فروشنده لینک می شود.

## استفاده دوباره از فروشنده

`Provider` همچنان رابطه فروشنده با یک پرونده مشخص است، اما حالا می تواند `sellerProfileId` داشته باشد. انتخاب فروشنده قبلی در فرم استعلام این شناسه را نگه می دارد و در پرونده جدید Provider همان Seller Profile ساخته یا استفاده می شود.

اگر کاربر بعد از انتخاب فروشنده قبلی، نام یا شماره را دستی تغییر دهد، انتخاب سراسری قبلی پاک می شود تا داده جدید به اشتباه به فروشنده دیگری وصل نشود.

## ویرایش سراسری

ویرایش نام یا شماره اصلی در Seller Profile روی تمام Providerهای مرتبط همگام می شود. شناسه Provider و Quote تغییر نمی کند، بنابراین تاریخچه قیمت، انتخاب نهایی، خرید، پیگیری و Attachmentها سالم می مانند.

فیلدهای تکمیلی پروفایل شامل این موارد است:

```text
name
phone
otherPhones
website
instagram
telegram
whatsapp
note
favorite
avoid
```

## ادغام فروشنده های تکراری

کاربر می تواند یک پروفایل را در پروفایل دیگری ادغام کند. پیشنهادهای مشابه بر اساس نام نرمال شده یا شماره مشترک بالاتر نمایش داده می شوند، اما ادغام فقط با انتخاب صریح کاربر و تأیید Checkbox انجام می شود.

در Merge:

- پروفایل مقصد باقی می ماند.
- شماره ها و راه های ارتباطی قابل حفظ از پروفایل مبدا به مقصد اضافه می شوند.
- اگر یکی از دو پروفایل Avoid باشد، پروفایل نهایی Avoid می ماند و Favorite غیرفعال می شود.
- یادداشت های متفاوت با هم حفظ می شوند.
- Providerهای مبدا به Seller Profile مقصد وصل می شوند.
- اگر هر دو فروشنده در یک پرونده Provider جدا داشته باشند، یک Provider به عنوان رکورد اصلی باقی می ماند.
- Quoteها و Reminderهای Provider تکراری به Provider اصلی منتقل می شوند.
- شناسه Quoteها و نتیجه خرید تغییر نمی کند.
- Provider تکراری و در پایان Seller Profile مبدا حذف می شود.

## مدل داده و Migration

نام دیتابیس بدون تغییر باقی مانده است:

```text
estelamkoo-local
```

Dexie schema از **v5** به **v6** ارتقا یافته است.

Store جدید:

```text
sellerProfiles: &id, name, phone, updatedAt
```

Indexهای Provider در v6:

```text
&id
caseId
sellerProfileId
name
rating
updatedAt
[sellerProfileId+caseId]
```

### Migration v5 -> v6

در اولین باز شدن دیتابیس:

1. همه Providerهای قبلی خوانده می شوند.
2. شماره تلفن نرمال می شود و در اولویت هویت قرار می گیرد.
3. Providerهای دارای شماره یکسان به یک Seller Profile وصل می شوند.
4. اگر شماره وجود نداشته باشد، نام نرمال شده برای گروه بندی fallback استفاده می شود.
5. برای هر Provider مقدار `sellerProfileId` ذخیره می شود.
6. نام و شماره Provider با پروفایل سراسری همگام می شود.
7. اگر Provider امتیاز قبلی داشته باشد، `ratingUpdatedAt` از `updatedAt` قبلی مقدار اولیه می گیرد.

این migration شناسه Quote، Provider، PurchaseCase، Reminder یا Attachment را عوض نمی کند و داده قبلی حذف نمی شود.

## Backup / Restore

فرمت اصلی Backup همچنان version 1 است. `sellerProfiles` به صورت optional به ساختار اضافه شده تا Backupهای نسخه های قبلی همچنان قابل Restore باشند.

Backup جدید شامل این موارد است:

```text
purchaseCases
providers
quotes
reminders
attachments
budgetPlans
sellerProfiles
preferences
```

Parser موارد زیر را اعتبارسنجی می کند:

- شناسه یکتای Seller Profile.
- نام و تاریخ های اصلی پروفایل.
- ساختار شماره های دیگر و راه های ارتباطی.
- نوع Favorite و Avoid.
- معتبر بودن `providers.sellerProfileId` نسبت به Seller Profileهای همان Backup.

اگر Backup قدیمی `sellerProfiles` نداشته باشد، هنگام Restore پروفایل های سراسری از Providerهای موجود ساخته می شوند.

## Insights و Provider History

هویت فروشنده در Provider History و Insights حالا ابتدا از `sellerProfileId` استفاده می کند. فقط برای داده فاقد شناسه پایدار، fallback نام/شماره حفظ شده است. این تغییر جلوی جداشدن یک فروشنده بعد از ویرایش سراسری نام را می گیرد.

## PWA

Service Worker cache version:

```text
besanj-shell-v14
```

## Dependency و اصلاح امنیتی

Dependency جدیدی اضافه نشده است. در زمان QA مقصد، `npm audit` دو آسیب پذیری بحرانی Next.js را برای نسخه 16.3.2 گزارش کرد. برای بستن این مورد پیش از Release، نسخه های زیر به patch امن فعلی ارتقا داده شدند:

```text
next: 16.3.4
eslint-config-next: 16.3.4
```

این تغییر فقط patch-level است و مدل داده، API داخلی برنامه یا قابلیت های v1.3 را تغییر نمی دهد.

## Guard جدید

```text
npm run check:sellers
```

این Guard فقط وجود فایل ها را بررسی نمی کند و موارد زیر را کنترل می کند:

- Dexie v6 و store سراسری Seller Profile.
- ارتباط `sellerProfileId` با Provider.
- مسیر فهرست و پروفایل فروشنده.
- ویرایش سراسری، Favorite، Avoid و Merge.
- استفاده از هویت پایدار در Quote و Provider History.
- لینک Insights به Seller Profile.
- Backup/Restore داده فروشنده.

Guard در `npm run check` قرار گرفته است.

## تست های اضافه شده

`tests/seller-profiles.test.ts` پوشش می دهد:

- ساخت Seller Profile از Providerهای قدیمی.
- یکی شدن شماره تلفن یکسان بین پرونده ها.
- حفظ شناسه Seller Profile موجود.
- اولویت شناسه پایدار در هویت فروشنده.
- Merge اطلاعات تماس، یادداشت و trust flags.
- محاسبه استعلام، خرید، امتیاز و تحویل فروشنده.
- مرتب سازی Favorite و Avoid در directory.
- پیشنهاد فروشنده تکراری با نام یا شماره.

`tests/backup.test.ts` نیز برای حفظ Seller Profile، سازگاری Backup قدیمی و رد کردن لینک شکسته تست جدید دارد.

## فایل های اصلی این Release

```text
app/sellers/page.tsx
app/sellers/[id]/page.tsx
components/seller-directory-page.tsx
components/seller-profile-page.tsx
components/seller-profile-edit-sheet.tsx
components/seller-merge-sheet.tsx
components/quote-form-dialog.tsx
components/quote-comparison.tsx
lib/seller-profiles.ts
lib/db.ts
lib/provider-history.ts
lib/insights.ts
lib/backup.ts
lib/backup-format.ts
lib/types.ts
scripts/check-seller-profiles.mjs
tests/seller-profiles.test.ts
tests/backup.test.ts
```

## Branch پیشنهادی

```text
feat/seller-profiles-v1.3
```
