# سیاست استفاده از PersianLabs/ui

بسنج یک محصول فارسی و RTL است. قبل از ساخت هر کنترل جدید باید مستندات `https://ui.persian-labs.ir/docs` بررسی شود. اگر PersianLabs/ui برای مسئله کامپوننت سطح محصول دارد، همان کامپوننت یا سورس Registry آن مبناست؛ کنترل native مرورگر جایگزین قابل قبول نیست مگر دلیل فنی مستند داشته باشد.

| نیاز | انتخاب استاندارد در بسنج |
| --- | --- |
| تاریخ شمسی | `DatePicker` محصول با موتور **Doran**؛ Popover دسکتاپ و Bottom Sheet قابل‌کشیدن در موبایل |
| مبلغ | `PriceInput` داخل `InputGroup` با **فقط `TomanIcon`** به‌عنوان addon دیداری |
| انتخاب یک مقدار | `Select` با `items` map برای resolve شدن label انتخاب‌شده؛ اگر جست‌وجو لازم شد `Combobox` |
| شماره موبایل ایران | `MobileNumberInput` |
| گزینه بله/خیر | `Checkbox` |
| انتخاب تک‌گزینه‌ای نمایشی | `RadioGroup` |
| ساختار فیلد/خطا | `Field` از طریق `FormField` محصول |
| راهنمای کوتاه رابط | `Tooltip` رسمی PersianLabs/ui از طریق `HelpHint` سراسری |
| تب‌ها | `Tabs` |
| کارت/Badge/Button/Input/Textarea | کامپوننت‌های Registry PersianLabs با تم بسنج |


## Tooltip و متن راهنما

برای متن های توضیحی غیرحیاتی، الگوی استاندارد بسنج `HelpHint` است. این wrapper از Tooltip رسمی PersianLabs/ui استفاده می کند و یک آیکن سوال کوچک کنار عنوان یا label نشان می دهد. Tooltip با hover و focus قابل دسترسی است و direction پرتال در RTL از پیاده سازی PersianLabs حفظ شده است.

مواردی که نباید داخل Tooltip پنهان شوند:

- خطاهای اعتبارسنجی و خطاهای عملیاتی
- هشدارهای destructive مانند جایگزینی Backup
- هشدارهایی که می گویند انتخاب یا داده فعلی ناسازگار/قدیمی است
- دستورالعملی که بدون دیدن آن کاربر نمی تواند همان لحظه عمل را کامل کند

`ResponsiveSheet` توضیح header را خودکار به `HelpHint` تبدیل می کند و `FormField` نیز `hint` را به Tooltip می برد. بنابراین مصرف کننده ها نباید متن راهنمای تکراری زیر این دو کامپوننت بسازند.

## نکته مهم Select

در Base UI، `SelectValue` برای تبدیل value داخلی به label نمایشی به `items` در root نیاز دارد. بنابراین این الگو الزامی است:

```tsx
<Select
  value={value}
  onValueChange={setValue}
  items={options.map((item) => ({ value: item.value, label: item.label }))}
>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {options.map((item) => (
      <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
    ))}
  </SelectContent>
</Select>
```

بدون `items` ممکن است trigger مقدار داخلی مثل `balanced` یا UUID را نمایش دهد. `check:ui` برای Selectهای لایه محصول این مورد را کنترل می‌کند.

## نکته مهم مبلغ

ورودی مبلغ فقط یک واحد دیداری دارد: `TomanIcon`. متن «تومان» کنار آن تکرار نمی‌شود. برای screen reader یک متن `sr-only` مجاز است.

## Guardrail

`npm run check:ui` سورس محصول را اسکن می‌کند و برای موارد زیر fail می‌شود. `npm run check:tooltips` نیز الگوی Tooltip سراسری، RTL و باقی ماندن هشدارهای حیاتی را کنترل می کند:

- `<select>` native
- ``input type="date"`
- `NativeSelect`
- checkbox native
- raw `<button>` / `<input>` / `<textarea>` در product layer
- استفاده از `PriceInput` بیرون از `InputGroup`
- استفاده از root `Select` در product layer بدون `items`

این تست عمداً ساده و سخت‌گیر است تا خطاهای نسخه‌های اولیه دوباره در فازهای بعدی تکرار نشوند.


## استثنای مستند تقویم

از نسخه 0.4، DatePicker تنها استثنای آگاهانهٔ این سیاست است. به درخواست محصول، موتور تقویم از Doran گرفته می‌شود اما UI از Primitiveهای همین پروژه ساخته شده است. این دقیقاً با راهنمای shadcn خود Doran هم‌راستا است: منطق تقویم از Doran و ظاهر از کامپوننت‌های پروژه.
