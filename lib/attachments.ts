export const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;
export const MAX_ATTACHMENTS_PER_QUOTE = 5;
export const MAX_ATTACHMENTS_TOTAL_BYTES = 24 * 1024 * 1024;

export interface AttachmentLike {
  name: string;
  size: number;
  type?: string;
}

export function validateAttachmentSelection(files: AttachmentLike[]) {
  if (files.length > MAX_ATTACHMENTS_PER_QUOTE) {
    return `حداکثر ${MAX_ATTACHMENTS_PER_QUOTE.toLocaleString("fa-IR")} فایل برای هر استعلام می‌توانی اضافه کنی.`;
  }

  const tooLarge = files.find((file) => file.size > MAX_ATTACHMENT_BYTES);
  if (tooLarge) {
    return `فایل «${tooLarge.name}» بیشتر از ۸ مگابایت است.`;
  }

  const total = files.reduce((sum, file) => sum + Math.max(0, file.size), 0);
  if (total > MAX_ATTACHMENTS_TOTAL_BYTES) {
    return "حجم مجموع پیوست‌های این استعلام نباید بیشتر از ۲۴ مگابایت باشد.";
  }

  return null;
}

export function formatFileSize(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "۰ بایت";
  if (size < 1024) return `${Math.round(size).toLocaleString("fa-IR")} بایت`;
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024).toLocaleString("fa-IR")} کیلوبایت`;
  }
  return `${(size / (1024 * 1024)).toLocaleString("fa-IR", {
    maximumFractionDigits: 1,
  })} مگابایت`;
}
