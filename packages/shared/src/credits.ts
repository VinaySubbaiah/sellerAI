import { DEFAULT_CREDIT_COSTS } from "./constants.js";

export type CreditCostMap = Record<string, number>;

export function getCreditCost(key: string, costs: CreditCostMap = DEFAULT_CREDIT_COSTS): number {
  const value = costs[key];
  if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
    throw new Error(`Unknown or invalid credit cost: ${key}`);
  }
  return value;
}

export function calculateJobCredits(input: {
  jobType: string;
  photoCount?: number;
  useAiBackground?: boolean;
  costs?: CreditCostMap;
}): number {
  const costs = input.costs ?? DEFAULT_CREDIT_COSTS;
  switch (input.jobType) {
    case "LISTING_PACK":
      return getCreditCost("MARKETPLACE_LISTING", costs);
    case "PRODUCT_PHOTOS":
      return getCreditCost("AI_PRODUCT_IMAGE", costs) * Math.max(1, input.photoCount ?? 1);
    case "MARKETING":
      return getCreditCost("MARKETING_CREATIVE", costs);
    case "ANIMATED_REEL":
      return getCreditCost("ANIMATED_REEL", costs);
    case "PHOTO_EDIT":
      return input.useAiBackground ? getCreditCost("AI_BACKGROUND", costs) : 0;
    case "ANALYZE_PRODUCT":
    case "ZIP_EXPORT":
      return 0;
    default:
      throw new Error(`Unsupported job type for credits: ${input.jobType}`);
  }
}

export function canAfford(balance: number, required: number): boolean {
  return balance >= required && required >= 0;
}

export function assertNonNegativeBalance(balance: number): void {
  if (balance < 0) {
    throw new Error("Credit balance cannot be negative");
  }
}

export function applyLedgerDelta(balance: number, amount: number): number {
  const next = balance + amount;
  assertNonNegativeBalance(next);
  return next;
}
