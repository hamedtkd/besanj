export type PurchaseKind = "product" | "service";
export type PurchaseStatus = "active" | "decided" | "archived";

export type QuoteChannel =
  | "phone"
  | "whatsapp"
  | "instagram"
  | "telegram"
  | "inPerson"
  | "web"
  | "sms"
  | "email"
  | "bale"
  | "eitaa"
  | "rubika"
  | "divar"
  | "sheypoor"
  | "other";

export type QuoteFreshness = "today" | "recent" | "stale" | "expired";

export interface CaseRequirement {
  id: string;
  label: string;
  createdAt: string;
}

export type PurchaseOutcomeStatus = "ordered" | "received";

export interface PurchaseOutcome {
  quoteId: string;
  status: PurchaseOutcomeStatus;
  purchasedAt: string;
  actualPaidToman: number;
  orderReference?: string;
  expectedDeliveryAt?: string;
  receivedAt?: string;
  note?: string;
  updatedAt: string;
}

export interface PurchaseCase {
  id: string;
  title: string;
  kind: PurchaseKind;
  description?: string;
  status: PurchaseStatus;
  selectedQuoteId?: string;
  targetBudgetToman?: number;
  categoryKey?: string;
  categoryLabel?: string;
  tags?: string[];
  requirements?: CaseRequirement[];
  purchaseOutcome?: PurchaseOutcome;
  createdAt: string;
  updatedAt: string;
}

export interface Provider {
  id: string;
  caseId: string;
  name: string;
  phone?: string;
  rating?: number;
  ratingNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  caseId: string;
  providerId: string;
  priceToman: number;
  extraCostToman?: number;
  quotedAt: string;
  validUntil?: string;
  deliveryDays?: number;
  warranty?: string;
  paymentTerms?: string;
  channel: QuoteChannel;
  contactRef?: string;
  note?: string;
  requirementChecks?: Record<string, boolean>;
  previousQuoteId?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReminderStatus = "open" | "done";

export interface CaseReminder {
  id: string;
  caseId: string;
  providerId?: string;
  quoteId?: string;
  title: string;
  dueAt: string;
  status: ReminderStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuoteAttachment {
  id: string;
  caseId: string;
  quoteId: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
  createdAt: string;
}


export interface BudgetPlan {
  id: "monthly";
  monthlyLimitToman?: number;
  categoryLimits?: Record<string, number>;
  updatedAt: string;
}

export interface CaseMetrics {
  providerCount: number;
  quoteCount: number;
  latestQuotes: Quote[];
  minTotal: number | null;
  maxTotal: number | null;
  spread: number | null;
  latestQuotedAt: string | null;
}

export type QuoteSort = "priceAsc" | "priceDesc" | "newest" | "delivery";
export type FreshnessFilter = "all" | QuoteFreshness;
export type WarrantyFilter = "all" | "with" | "without";

export interface QuoteFilterState {
  search: string;
  providerId: string;
  channel: "all" | QuoteChannel;
  freshness: FreshnessFilter;
  warranty: WarrantyFilter;
  maxDeliveryDays: number | null;
  minPriceToman: number | null;
  maxPriceToman: number | null;
  quotedFrom: Date | null;
  quotedTo: Date | null;
  sort: QuoteSort;
}

export type DecisionProfile =
  | "balanced"
  | "cheapest"
  | "fastest"
  | "freshest"
  | "warranty";

export interface DecisionPreferences {
  profile: DecisionProfile;
  maxBudgetToman: number | null;
  maxDeliveryDays: number | null;
  requireFresh: boolean;
}

export interface DecisionResult {
  quoteId: string;
  score: number;
  eligible: boolean;
  reasons: string[];
}
