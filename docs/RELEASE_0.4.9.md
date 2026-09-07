# بسنج 0.4.9

## اصلاح lint React 19

این نسخه آخرین خطای `react-hooks/refs` در `QuoteFormDialog` را رفع می‌کند.

- ref مربوط به `submitMode` حذف شد.
- حالت submit از `SubmitEvent.submitter` خوانده می‌شود.
- «ثبت و بعدی» و «ثبت استعلام» با `value` استاندارد روی دکمه‌های submit از هم تفکیک می‌شوند.
- هیچ تغییری در مدل داده، دیتابیس یا UX فرم ایجاد نشده است.
