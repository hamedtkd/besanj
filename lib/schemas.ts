import { z } from "zod";
import { isValidIranPhone } from "@/lib/iranian-mobile";
import { isValidQuoteDateRange } from "@/lib/validation-rules";

export const purchaseCaseSchema = z.object({
  title: z.string().trim().min(2, "عنوان را وارد کن.").max(80, "عنوان خیلی طولانی است."),
  kind: z.enum(["product", "service"]),
  description: z.string().trim().max(500, "توضیح خیلی طولانی است.").optional(),
});

export type PurchaseCaseFormValues = z.infer<typeof purchaseCaseSchema>;

const channelSchema = z.enum([
  "phone",
  "whatsapp",
  "instagram",
  "telegram",
  "inPerson",
  "web",
  "sms",
  "email",
  "bale",
  "eitaa",
  "rubika",
  "divar",
  "sheypoor",
  "other",
]);

export const quoteFormSchema = z
  .object({
    providerName: z.string().trim().min(2, "نام فروشنده یا ارائه‌دهنده را وارد کن.").max(100),
    phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .refine((value) => !value || isValidIranPhone(value), "شماره موبایل کامل و معتبر وارد کن."),
    priceToman: z.number({ error: "قیمت را وارد کن." }).positive("قیمت باید بیشتر از صفر باشد."),
    extraCostToman: z.number().min(0, "هزینه اضافه نمی‌تواند منفی باشد.").nullable().optional(),
    quotedAt: z.date({ error: "تاریخ استعلام را انتخاب کن." }),
    validUntil: z.date().nullable().optional(),
    deliveryDays: z
      .number()
      .int("تعداد روز باید عدد صحیح باشد.")
      .min(0, "زمان تحویل نمی‌تواند منفی باشد.")
      .nullable()
      .optional(),
    warranty: z.string().trim().max(120).optional(),
    paymentTerms: z.string().trim().max(180).optional(),
    channel: channelSchema,
    contactRef: z.string().trim().max(240, "مرجع تماس خیلی طولانی است.").optional(),
    note: z.string().trim().max(1000, "یادداشت خیلی طولانی است.").optional(),
  })
  .refine((data) => isValidQuoteDateRange(data.quotedAt, data.validUntil), {
    message: "اعتبار قیمت نمی‌تواند قبل از تاریخ استعلام باشد.",
    path: ["validUntil"],
  });

export type QuoteFormValues = z.infer<typeof quoteFormSchema>;
