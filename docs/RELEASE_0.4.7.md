# بسنج 0.4.7

## اصلاح typecheck

- رفع آخرین خطای TypeScript در `components/case-screen.tsx`.
- شناسه انتخاب نهایی پس از guard پرونده در مقدار پایدار `selectedQuoteId` نگه‌داری می‌شود تا callback `chooseQuote` دیگر روی مقدار potentially undefined بسته نشود.
- هیچ تغییری در رفتار انتخاب/لغو انتخاب نهایی یا داده‌های Dexie ایجاد نشده است.

این نسخه یک patch کوچک typecheck است و schema دیتابیس و PWA بدون تغییر باقی مانده‌اند.
