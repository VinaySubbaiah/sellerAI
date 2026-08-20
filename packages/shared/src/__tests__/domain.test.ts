import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { applyLedgerDelta, calculateJobCredits, canAfford } from "../credits";
import { parseAiJson, productAnalysisSchema, listingContentSchema } from "../ai-schema";
import { scoreReadiness } from "../readiness";
import { assertOwned } from "../ownership";
import { razorpayCheckoutSignature, verifyRazorpayCheckoutSignature, verifyRazorpayWebhookSignature } from "../razorpay";
import { AppError } from "../errors";

describe("credit calculation", () => {
  it("charges listing packs at 8 credits", () => {
    expect(calculateJobCredits({ jobType: "LISTING_PACK" })).toBe(8);
  });
  it("multiplies photo variants", () => {
    expect(calculateJobCredits({ jobType: "PRODUCT_PHOTOS", photoCount: 3 })).toBe(3);
  });
  it("does not charge deterministic edits", () => {
    expect(calculateJobCredits({ jobType: "PHOTO_EDIT", useAiBackground: false })).toBe(0);
  });
  it("charges AI background edits", () => {
    expect(calculateJobCredits({ jobType: "PHOTO_EDIT", useAiBackground: true })).toBe(1);
  });
  it("blocks overdraft", () => {
    expect(canAfford(4, 8)).toBe(false);
    expect(() => applyLedgerDelta(4, -8)).toThrow();
    expect(applyLedgerDelta(8, -8)).toBe(0);
  });
});

describe("AI schema validation", () => {
  it("parses wrapped JSON", () => {
    const raw = 'Here you go\n{"productName":"Mug","category":"Kitchen","colors":["white"],"possibleFeatures":[],"possibleMaterial":null,"confidenceNotes":[],"warnings":[]}';
    const data = parseAiJson(raw, productAnalysisSchema);
    expect(data.productName).toBe("Mug");
  });
  it("rejects malformed JSON", () => {
    expect(() => parseAiJson("not json", productAnalysisSchema)).toThrow();
  });
  it("validates listing copy", () => {
    const data = parseAiJson(
      JSON.stringify({
        title: "Mug",
        bulletPoints: ["a", "b", "c", "d", "e"],
        description: "desc",
        keywords: ["mug"],
        warnings: [],
        requiresUserInput: [],
      }),
      listingContentSchema,
    );
    expect(data.bulletPoints).toHaveLength(5);
  });
});

describe("readiness", () => {
  it("scores a complete listing highly", () => {
    const result = scoreReadiness({
      imageCount: 3,
      maxWidth: 1600,
      maxHeight: 1600,
      hasMainImage: true,
      productCentered: true,
      whiteBackgroundLikely: true,
      promotionalTextOnMain: false,
      dimensionsVerified: true,
      hasTitle: true,
      hasBullets: true,
      hasDescription: true,
      hasKeywords: true,
    });
    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.label).toBe("Excellent");
  });
  it("penalizes promo text and missing dimensions", () => {
    const result = scoreReadiness({
      imageCount: 1,
      maxWidth: 1600,
      maxHeight: 1600,
      hasMainImage: true,
      promotionalTextOnMain: true,
      dimensionsVerified: false,
    });
    expect(result.score).toBeLessThan(90);
    expect(result.checks.some((c) => c.id === "promo-text" && c.status === "warn")).toBe(true);
  });
});

describe("ownership guards", () => {
  it("throws when missing", () => {
    expect(() => assertOwned(null, "u1")).toThrow(AppError);
  });
  it("throws when another user", () => {
    expect(() => assertOwned({ userId: "u2" }, "u1")).toThrow(AppError);
  });
  it("returns owned entity", () => {
    expect(assertOwned({ userId: "u1", id: "p" }, "u1").id).toBe("p");
  });
});

describe("razorpay signatures", () => {
  it("verifies checkout signatures", () => {
    const secret = "test_secret";
    const signature = razorpayCheckoutSignature("order_1", "pay_1", secret);
    expect(
      verifyRazorpayCheckoutSignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature,
        secret,
      }),
    ).toBe(true);
    expect(
      verifyRazorpayCheckoutSignature({
        orderId: "order_1",
        paymentId: "pay_1",
        signature: "deadbeef",
        secret,
      }),
    ).toBe(false);
  });
  it("verifies webhook signatures", () => {
    const secret = "whsec";
    const rawBody = '{"event":"payment.captured"}';
    const signature = createHmac("sha256", secret).update(rawBody).digest("hex");
    expect(verifyRazorpayWebhookSignature({ rawBody, signature, secret })).toBe(true);
  });
});
