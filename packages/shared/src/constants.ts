export const PLATFORMS = ["AMAZON", "FLIPKART", "MEESHO", "SHOPIFY", "INSTAGRAM"] as const;
export type Platform = (typeof PLATFORMS)[number];

export const BRAND_STYLES = ["MINIMAL", "PREMIUM", "NATURAL", "LUXURY", "BOLD", "PLAYFUL"] as const;
export type BrandStyle = (typeof BRAND_STYLES)[number];

export const CONTENT_LANGUAGES = ["ENGLISH", "HINDI", "KANNADA"] as const;
export type ContentLanguage = (typeof CONTENT_LANGUAGES)[number];

export const JOB_STATUSES = ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const PROJECT_TYPES = [
  "LISTING",
  "PRODUCT_PHOTOS",
  "MARKETING",
  "PHOTO_EDIT",
  "ANIMATED_REEL",
] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const LEDGER_TYPES = [
  "SIGNUP_BONUS",
  "PURCHASE",
  "RESERVATION",
  "CONSUMPTION",
  "REFUND",
  "ADMIN_ADJUSTMENT",
] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const PAYMENT_STATUSES = ["CREATED", "PENDING", "PAID", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const LISTING_ASSET_OPTIONS = [
  "MAIN_IMAGE",
  "LIFESTYLE",
  "FEATURE",
  "BENEFITS",
  "DIMENSIONS",
  "COMPARISON",
  "BRAND_STORY",
] as const;
export type ListingAssetOption = (typeof LISTING_ASSET_OPTIONS)[number];

export const PHOTO_STYLES = [
  "PURE_WHITE",
  "STUDIO",
  "LIFESTYLE",
  "LUXURY",
  "NATURAL",
  "MINIMAL",
  "CUSTOM",
] as const;
export type PhotoStyle = (typeof PHOTO_STYLES)[number];

export const MARKETING_PURPOSES = [
  "SALE",
  "NEW_ARRIVAL",
  "FESTIVAL",
  "PRODUCT_LAUNCH",
  "LIMITED_OFFER",
  "GENERAL_PROMOTION",
] as const;
export type MarketingPurpose = (typeof MARKETING_PURPOSES)[number];

export const MARKETING_FORMATS = [
  "INSTAGRAM_POST",
  "INSTAGRAM_STORY",
  "WHATSAPP_STATUS",
  "FACEBOOK_POST",
  "WEBSITE_BANNER",
] as const;
export type MarketingFormat = (typeof MARKETING_FORMATS)[number];

export const MARKETING_VARIANTS = ["PREMIUM", "BOLD", "MINIMAL"] as const;

export const EDITOR_TOOLS = [
  "REMOVE_BACKGROUND",
  "WHITE_BACKGROUND",
  "TRANSPARENT_BACKGROUND",
  "AI_BACKGROUND",
  "CROP",
  "RESIZE",
  "CENTER",
  "LIGHTING",
  "SHADOW",
  "ENHANCE",
] as const;
export type EditorTool = (typeof EDITOR_TOOLS)[number];

export const EDITOR_PRESETS = [
  "AMAZON",
  "FLIPKART",
  "MEESHO",
  "INSTAGRAM_POST",
  "INSTAGRAM_STORY",
  "WHATSAPP_STATUS",
] as const;

export const REEL_STYLES = ["PREMIUM", "ENERGETIC", "MINIMAL", "CLEAN"] as const;
export const REEL_DURATIONS = [5, 10] as const;

export const GENERATION_JOB_TYPES = {
  ANALYZE_PRODUCT: "ANALYZE_PRODUCT",
  LISTING_PACK: "LISTING_PACK",
  PRODUCT_PHOTOS: "PRODUCT_PHOTOS",
  MARKETING: "MARKETING",
  PHOTO_EDIT: "PHOTO_EDIT",
  ANIMATED_REEL: "ANIMATED_REEL",
  ZIP_EXPORT: "ZIP_EXPORT",
} as const;

export type GenerationJobType = (typeof GENERATION_JOB_TYPES)[keyof typeof GENERATION_JOB_TYPES];

export const DEFAULT_CREDIT_COSTS: Record<string, number> = {
  AI_PRODUCT_IMAGE: 1,
  MARKETING_CREATIVE: 2,
  ANIMATED_REEL: 3,
  MARKETPLACE_LISTING: 8,
  AI_BACKGROUND: 1,
};

export const SIGNUP_BONUS_CREDITS = 4;

export const CREDIT_PACKAGES = [
  { code: "STARTER", name: "Starter", credits: 20, amountPaise: 9900, popular: false },
  { code: "CREATOR", name: "Creator", credits: 70, amountPaise: 29900, popular: true },
  { code: "BUSINESS", name: "Business", credits: 125, amountPaise: 49900, popular: false },
] as const;

export const FREE_PLAN = {
  code: "FREE",
  name: "Free",
  credits: 4,
  amountPaise: 0,
};

export const MAX_PRODUCT_IMAGES = 5;
export const MIN_PRODUCT_IMAGES = 1;
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const ALLOWED_IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;

export const SENSITIVE_SPEC_FIELDS = [
  "dimensions",
  "materials",
  "ingredients",
  "warranty",
  "certifications",
  "capacity",
  "compatibility",
  "medicalClaims",
  "performanceClaims",
] as const;
