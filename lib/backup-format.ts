import type {
  BudgetPlan,
  CaseReminder,
  Provider,
  PurchaseCase,
  Quote,
  QuoteAttachment,
} from "./types";
import type { ThemeMode } from "./theme";

export const BESANJ_BACKUP_FORMAT = "besanj-backup";
export const BESANJ_BACKUP_VERSION = 1;
export const MAX_BACKUP_IMPORT_BYTES = 128 * 1024 * 1024;

export interface PortablePreferences {
  theme?: ThemeMode;
  palette?: "amber" | "blue" | "violet" | "rose" | "custom";
  customColor?: string;
  savedColors?: string[];
}

export interface BackupSnapshot {
  purchaseCases: PurchaseCase[];
  providers: Provider[];
  quotes: Quote[];
  reminders: CaseReminder[];
  attachments: QuoteAttachment[];
  budgetPlans?: BudgetPlan[];
}

export interface PortableAttachment extends Omit<QuoteAttachment, "blob"> {
  dataBase64: string;
}

export interface BesanjBackupFile {
  format: typeof BESANJ_BACKUP_FORMAT;
  version: typeof BESANJ_BACKUP_VERSION;
  appVersion: string;
  exportedAt: string;
  preferences?: PortablePreferences;
  stats: {
    cases: number;
    providers: number;
    quotes: number;
    reminders: number;
    attachments: number;
    attachmentBytes: number;
    budgetPlans?: number;
  };
  data: {
    purchaseCases: PurchaseCase[];
    providers: Provider[];
    quotes: Quote[];
    reminders: CaseReminder[];
    attachments: PortableAttachment[];
    budgetPlans?: BudgetPlan[];
  };
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`بخش «${label}» در فایل پشتیبان معتبر نیست.`);
  }
  return value;
}

function requireRow(value: unknown, label: string) {
  const row = objectRecord(value);
  if (!row) throw new Error(`یکی از ردیف‌های «${label}» معتبر نیست.`);
  return row;
}

function requireStringField(
  row: Record<string, unknown>,
  key: string,
  label: string
) {
  const value = row[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`فیلد «${key}» در یکی از ردیف‌های «${label}» معتبر نیست.`);
  }
  return value;
}

function parsePreferences(value: unknown): PortablePreferences | undefined {
  const row = objectRecord(value);
  if (!row) return undefined;

  const theme =
    row.theme === "system" || row.theme === "light" || row.theme === "dark"
      ? row.theme
      : undefined;
  const palette =
    row.palette === "amber" ||
    row.palette === "blue" ||
    row.palette === "violet" ||
    row.palette === "rose" ||
    row.palette === "custom"
      ? row.palette
      : undefined;
  const customColor =
    typeof row.customColor === "string" ? row.customColor : undefined;
  const savedColors = Array.isArray(row.savedColors)
    ? row.savedColors.filter(
        (item): item is string => typeof item === "string"
      )
    : undefined;

  return {
    ...(theme ? { theme } : {}),
    ...(palette ? { palette } : {}),
    ...(customColor ? { customColor } : {}),
    ...(savedColors ? { savedColors } : {}),
  };
}

function encodeBytesBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, offset + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function decodeBase64Bytes(value: string) {
  let binary: string;
  try {
    binary = atob(value);
  } catch {
    throw new Error("داده یکی از پیوست‌های فایل پشتیبان خراب است.");
  }
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export async function buildBesanjBackupFile(
  snapshot: BackupSnapshot,
  options: {
    appVersion: string;
    exportedAt?: string;
    preferences?: PortablePreferences;
  }
): Promise<BesanjBackupFile> {
  const portableAttachments: PortableAttachment[] = [];
  let attachmentBytes = 0;

  for (const attachment of snapshot.attachments) {
    const bytes = new Uint8Array(await attachment.blob.arrayBuffer());
    attachmentBytes += bytes.byteLength;
    portableAttachments.push({
      id: attachment.id,
      caseId: attachment.caseId,
      quoteId: attachment.quoteId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: bytes.byteLength,
      createdAt: attachment.createdAt,
      dataBase64: encodeBytesBase64(bytes),
    });
  }

  return {
    format: BESANJ_BACKUP_FORMAT,
    version: BESANJ_BACKUP_VERSION,
    appVersion: options.appVersion,
    exportedAt: options.exportedAt ?? new Date().toISOString(),
    ...(options.preferences ? { preferences: options.preferences } : {}),
    stats: {
      cases: snapshot.purchaseCases.length,
      providers: snapshot.providers.length,
      quotes: snapshot.quotes.length,
      reminders: snapshot.reminders.length,
      attachments: portableAttachments.length,
      attachmentBytes,
      budgetPlans: snapshot.budgetPlans?.length ?? 0,
    },
    data: {
      purchaseCases: snapshot.purchaseCases,
      providers: snapshot.providers,
      quotes: snapshot.quotes,
      reminders: snapshot.reminders,
      attachments: portableAttachments,
      budgetPlans: snapshot.budgetPlans ?? [],
    },
  };
}

export function parseBesanjBackupText(text: string): BesanjBackupFile {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("این فایل JSON معتبر نیست.");
  }

  const root = objectRecord(parsed);
  if (!root) throw new Error("ساختار فایل پشتیبان معتبر نیست.");
  if (root.format !== BESANJ_BACKUP_FORMAT) {
    throw new Error("این فایل، پشتیبان معتبر بسنج نیست.");
  }
  if (root.version !== BESANJ_BACKUP_VERSION) {
    throw new Error("نسخه این فایل پشتیبان توسط این نسخه بسنج پشتیبانی نمی‌شود.");
  }
  if (typeof root.appVersion !== "string" || typeof root.exportedAt !== "string") {
    throw new Error("اطلاعات نسخه یا تاریخ فایل پشتیبان ناقص است.");
  }

  const data = objectRecord(root.data);
  if (!data) throw new Error("داده‌های فایل پشتیبان ناقص است.");

  const purchaseCases = requireArray(data.purchaseCases, "پرونده‌ها");
  const providers = requireArray(data.providers, "فروشنده‌ها");
  const quotes = requireArray(data.quotes, "استعلام‌ها");
  const reminders = requireArray(data.reminders, "پیگیری‌ها");
  const attachments = requireArray(data.attachments, "پیوست‌ها");
  const budgetPlans = data.budgetPlans === undefined
    ? []
    : requireArray(data.budgetPlans, "بودجه‌ها");

  const caseIds = new Set<string>();
  const selectedQuotes: Array<{ caseId: string; quoteId: string }> = [];
  const purchaseOutcomes: Array<{ caseId: string; quoteId: string }> = [];
  for (const raw of purchaseCases) {
    const row = requireRow(raw, "پرونده‌ها");
    const id = requireStringField(row, "id", "پرونده‌ها");
    requireStringField(row, "title", "پرونده‌ها");
    requireStringField(row, "createdAt", "پرونده‌ها");
    requireStringField(row, "updatedAt", "پرونده‌ها");
    if (row.kind !== "product" && row.kind !== "service") {
      throw new Error("نوع یکی از پرونده‌های فایل پشتیبان معتبر نیست.");
    }
    if (
      row.status !== "active" &&
      row.status !== "decided" &&
      row.status !== "archived"
    ) {
      throw new Error("وضعیت یکی از پرونده‌های فایل پشتیبان معتبر نیست.");
    }
    if (row.categoryKey !== undefined && typeof row.categoryKey !== "string") {
      throw new Error("دسته‌بندی یکی از پرونده‌های فایل پشتیبان معتبر نیست.");
    }
    if (row.categoryLabel !== undefined && typeof row.categoryLabel !== "string") {
      throw new Error("نام دسته‌بندی یکی از پرونده‌های فایل پشتیبان معتبر نیست.");
    }
    if (row.tags !== undefined) {
      if (!Array.isArray(row.tags) || row.tags.some((tag) => typeof tag !== "string")) {
        throw new Error("برچسب‌های یکی از پرونده‌های فایل پشتیبان معتبر نیست.");
      }
    }
    if (caseIds.has(id)) throw new Error("شناسه تکراری در پرونده‌های پشتیبان وجود دارد.");
    caseIds.add(id);
    if (typeof row.selectedQuoteId === "string") {
      selectedQuotes.push({ caseId: id, quoteId: row.selectedQuoteId });
    }
    if (row.purchaseOutcome !== undefined) {
      const outcome = requireRow(row.purchaseOutcome, "نتیجه خرید");
      const quoteId = requireStringField(outcome, "quoteId", "نتیجه خرید");
      requireStringField(outcome, "purchasedAt", "نتیجه خرید");
      requireStringField(outcome, "updatedAt", "نتیجه خرید");
      if (outcome.status !== "ordered" && outcome.status !== "received") {
        throw new Error("وضعیت نتیجه خرید یکی از پرونده‌ها معتبر نیست.");
      }
      if (
        typeof outcome.actualPaidToman !== "number" ||
        !Number.isFinite(outcome.actualPaidToman) ||
        outcome.actualPaidToman <= 0
      ) {
        throw new Error("مبلغ واقعی یکی از خریدهای فایل پشتیبان معتبر نیست.");
      }
      for (const key of ["expectedDeliveryAt", "receivedAt"] as const) {
        if (outcome[key] !== undefined && typeof outcome[key] !== "string") {
          throw new Error("تاریخ نتیجه خرید در فایل پشتیبان معتبر نیست.");
        }
      }
      if (typeof row.selectedQuoteId !== "string" || row.selectedQuoteId !== quoteId) {
        throw new Error("نتیجه خرید باید به همان استعلام انتخاب نهایی پرونده اشاره کند.");
      }
      purchaseOutcomes.push({ caseId: id, quoteId });
    }
  }

  const providerIds = new Set<string>();
  const providerCase = new Map<string, string>();
  for (const raw of providers) {
    const row = requireRow(raw, "فروشنده‌ها");
    const id = requireStringField(row, "id", "فروشنده‌ها");
    const caseId = requireStringField(row, "caseId", "فروشنده‌ها");
    requireStringField(row, "name", "فروشنده‌ها");
    if (!caseIds.has(caseId)) {
      throw new Error("یکی از فروشنده‌ها به پرونده‌ای اشاره می‌کند که در پشتیبان نیست.");
    }
    if (providerIds.has(id)) throw new Error("شناسه تکراری در فروشنده‌های پشتیبان وجود دارد.");
    providerIds.add(id);
    providerCase.set(id, caseId);
  }

  const quoteIds = new Set<string>();
  const quoteCase = new Map<string, string>();
  for (const raw of quotes) {
    const row = requireRow(raw, "استعلام‌ها");
    const id = requireStringField(row, "id", "استعلام‌ها");
    const caseId = requireStringField(row, "caseId", "استعلام‌ها");
    const providerId = requireStringField(row, "providerId", "استعلام‌ها");
    requireStringField(row, "quotedAt", "استعلام‌ها");
    requireStringField(row, "channel", "استعلام‌ها");
    if (
      typeof row.priceToman !== "number" ||
      !Number.isFinite(row.priceToman) ||
      row.priceToman < 0
    ) {
      throw new Error("قیمت یکی از استعلام‌های فایل پشتیبان معتبر نیست.");
    }
    if (!caseIds.has(caseId) || providerCase.get(providerId) !== caseId) {
      throw new Error("ارتباط پرونده و فروشنده در یکی از استعلام‌های پشتیبان معتبر نیست.");
    }
    if (quoteIds.has(id)) throw new Error("شناسه تکراری در استعلام‌های پشتیبان وجود دارد.");
    quoteIds.add(id);
    quoteCase.set(id, caseId);
  }

  for (const selected of selectedQuotes) {
    if (quoteCase.get(selected.quoteId) !== selected.caseId) {
      throw new Error("انتخاب نهایی یکی از پرونده‌ها به استعلام معتبر همان پرونده اشاره نمی‌کند.");
    }
  }
  for (const outcome of purchaseOutcomes) {
    if (quoteCase.get(outcome.quoteId) !== outcome.caseId) {
      throw new Error("نتیجه خرید یکی از پرونده‌ها به استعلام معتبر همان پرونده اشاره نمی‌کند.");
    }
  }

  const reminderIds = new Set<string>();
  for (const raw of reminders) {
    const row = requireRow(raw, "پیگیری‌ها");
    const id = requireStringField(row, "id", "پیگیری‌ها");
    const caseId = requireStringField(row, "caseId", "پیگیری‌ها");
    requireStringField(row, "title", "پیگیری‌ها");
    requireStringField(row, "dueAt", "پیگیری‌ها");
    if (row.status !== "open" && row.status !== "done") {
      throw new Error("وضعیت یکی از پیگیری‌های فایل پشتیبان معتبر نیست.");
    }
    if (!caseIds.has(caseId)) {
      throw new Error("یکی از پیگیری‌ها به پرونده‌ای اشاره می‌کند که در پشتیبان نیست.");
    }
    if (
      typeof row.providerId === "string" &&
      providerCase.get(row.providerId) !== caseId
    ) {
      throw new Error("فروشنده یکی از پیگیری‌های پشتیبان معتبر نیست.");
    }
    if (
      typeof row.quoteId === "string" &&
      quoteCase.get(row.quoteId) !== caseId
    ) {
      throw new Error("استعلام یکی از پیگیری‌های پشتیبان معتبر نیست.");
    }
    if (reminderIds.has(id)) throw new Error("شناسه تکراری در پیگیری‌های پشتیبان وجود دارد.");
    reminderIds.add(id);
  }

  let attachmentBytes = 0;
  const attachmentIds = new Set<string>();
  for (const raw of attachments) {
    const row = requireRow(raw, "پیوست‌ها");
    const id = requireStringField(row, "id", "پیوست‌ها");
    const caseId = requireStringField(row, "caseId", "پیوست‌ها");
    const quoteId = requireStringField(row, "quoteId", "پیوست‌ها");
    requireStringField(row, "fileName", "پیوست‌ها");
    requireStringField(row, "mimeType", "پیوست‌ها");
    requireStringField(row, "createdAt", "پیوست‌ها");
    if (
      typeof row.size !== "number" ||
      !Number.isFinite(row.size) ||
      row.size < 0 ||
      typeof row.dataBase64 !== "string"
    ) {
      throw new Error("اطلاعات یکی از پیوست‌های فایل پشتیبان معتبر نیست.");
    }
    if (quoteCase.get(quoteId) !== caseId) {
      throw new Error("یکی از پیوست‌ها به استعلام معتبر همان پرونده اشاره نمی‌کند.");
    }
    if (attachmentIds.has(id)) throw new Error("شناسه تکراری در پیوست‌های پشتیبان وجود دارد.");
    attachmentIds.add(id);
    attachmentBytes += row.size;
  }

  const budgetPlanIds = new Set<string>();
  for (const raw of budgetPlans) {
    const row = requireRow(raw, "بودجه‌ها");
    const id = requireStringField(row, "id", "بودجه‌ها");
    requireStringField(row, "updatedAt", "بودجه‌ها");
    if (id !== "monthly") {
      throw new Error("شناسه تنظیمات بودجه در فایل پشتیبان معتبر نیست.");
    }
    if (
      row.monthlyLimitToman !== undefined &&
      (typeof row.monthlyLimitToman !== "number" ||
        !Number.isFinite(row.monthlyLimitToman) ||
        row.monthlyLimitToman <= 0)
    ) {
      throw new Error("سقف ماهانه در فایل پشتیبان معتبر نیست.");
    }
    if (row.categoryLimits !== undefined) {
      const limits = objectRecord(row.categoryLimits);
      if (!limits) throw new Error("سقف دسته‌ها در فایل پشتیبان معتبر نیست.");
      for (const [key, limit] of Object.entries(limits)) {
        if (!key.trim() || typeof limit !== "number" || !Number.isFinite(limit) || limit <= 0) {
          throw new Error("یکی از سقف‌های دسته در فایل پشتیبان معتبر نیست.");
        }
      }
    }
    if (budgetPlanIds.has(id)) throw new Error("شناسه تکراری در بودجه‌های پشتیبان وجود دارد.");
    budgetPlanIds.add(id);
  }

  return {
    format: BESANJ_BACKUP_FORMAT,
    version: BESANJ_BACKUP_VERSION,
    appVersion: root.appVersion,
    exportedAt: root.exportedAt,
    ...(() => {
      const preferences = parsePreferences(root.preferences);
      return preferences ? { preferences } : {};
    })(),
    stats: {
      cases: purchaseCases.length,
      providers: providers.length,
      quotes: quotes.length,
      reminders: reminders.length,
      attachments: attachments.length,
      attachmentBytes,
      budgetPlans: budgetPlans.length,
    },
    data: {
      purchaseCases: purchaseCases as PurchaseCase[],
      providers: providers as Provider[],
      quotes: quotes as Quote[],
      reminders: reminders as CaseReminder[],
      attachments: attachments as PortableAttachment[],
      budgetPlans: budgetPlans as BudgetPlan[],
    },
  };
}

export function decodeBackupAttachments(
  attachments: PortableAttachment[]
): QuoteAttachment[] {
  return attachments.map((attachment) => {
    const bytes = decodeBase64Bytes(attachment.dataBase64);
    if (bytes.byteLength !== attachment.size) {
      throw new Error(
        `حجم پیوست «${attachment.fileName}» با اطلاعات فایل پشتیبان هم‌خوان نیست.`
      );
    }

    return {
      id: attachment.id,
      caseId: attachment.caseId,
      quoteId: attachment.quoteId,
      fileName: attachment.fileName,
      mimeType: attachment.mimeType,
      size: bytes.byteLength,
      blob: new Blob([bytes], { type: attachment.mimeType }),
      createdAt: attachment.createdAt,
    };
  });
}

export function makeBackupFileName(exportedAt: string) {
  const date = exportedAt.slice(0, 10).replaceAll("-", "");
  return `besanj-backup-${date || "data"}.json`;
}
