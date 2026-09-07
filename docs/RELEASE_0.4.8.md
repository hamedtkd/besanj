# بسنج 0.4.8

این نسخه مخصوص بستن lint gate پروژه روی React 19 / Next.js 16 است.

## اصلاحات

- حذف synchronous state updates داخل Effectهای تنظیمات تم، انتخاب مقایسه، رنگ سفارشی، PWA و DatePicker.
- تبدیل shortlist مقایسه به state + derived valid ids تا بدون Effect با تغییر quoteها هماهنگ بماند.
- استفاده از `useWatch` به‌جای `form.watch` در فرم استعلام برای سازگاری با React Compiler lint.
- کامل شدن dependencyهای effect مربوط به رنگ سفارشی و پایدار شدن callbackهای AppPreferences با `useCallback` / `useMemo`.
- اصلاح warning فایل PostCSS با export نام‌دار.

## رفتار محصول

هیچ migration دیتابیس یا تغییر schema در این نسخه وجود ندارد. داده‌های محلی نسخه‌های قبلی حفظ می‌شوند. UX، منطق قیمت، تقویم Doran، PWA و انتخاب رنگ از نظر رفتاری تغییر هدفمند ندارند؛ تغییرات این نسخه برای پاک‌کردن lint errors/warnings و کم‌کردن renderهای غیرضروری است.

## بررسی

در محیط ساخت 37 تست Node، guardهای UI/Theme/PWA و scan نحوی 80 فایل TypeScript/TSX پاس شدند. اجرای نهایی `npm run check` باید روی ماشینی انجام شود که dependencyهای npm نصب هستند.
