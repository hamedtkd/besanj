# بسنج 0.4.6

این نسخه روی خطاهای واقعی `npm run check` نسخه 0.4.5 بسته شده است.

- رفع narrowing در `CaseScreen` برای داده async و callbackهای re-quote/انتخاب نهایی.
- سازگاری تمام Selectهای Base UI با قرارداد nullable `onValueChange` بدون وارد شدن `null` به state دامنه.
- حذف خودکار فایل‌های قدیمی `components/theme-toggle.tsx` و `components/ui/calendar.tsx` هنگام install/dev/check تا overlay روی نسخه‌های قبلی باعث typecheck failure نشود.
- نگه‌داشتن Doran به‌عنوان تنها stack تقویم محصول.
- افزودن `data-scroll-behavior="smooth"` مطابق هشدار Next.js 16 برای route transitionها.
