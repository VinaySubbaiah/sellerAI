export type ReadinessSeverity = "info" | "warning" | "error" | "pass";

export interface ReadinessCheck {
  id: string;
  status: "pass" | "fail" | "warn";
  message: string;
  severity: ReadinessSeverity;
  points: number;
}

export interface ReadinessResult {
  score: number;
  label: string;
  checks: ReadinessCheck[];
}

export interface ReadinessInput {
  imageCount: number;
  maxWidth: number;
  maxHeight: number;
  hasMainImage: boolean;
  productCentered?: boolean;
  whiteBackgroundLikely?: boolean;
  promotionalTextOnMain?: boolean;
  dimensionsVerified?: boolean;
  hasTitle?: boolean;
  hasBullets?: boolean;
  hasDescription?: boolean;
  hasKeywords?: boolean;
}

export const DEFAULT_READINESS_RULES = {
  minImages: 1,
  minResolution: 1000,
  mainImagePoints: 20,
  resolutionPoints: 20,
  countPoints: 10,
  centeredPoints: 10,
  backgroundPoints: 15,
  copyPoints: 15,
  promoPenalty: 10,
  dimensionsPenalty: 10,
};

export function scoreReadiness(
  input: ReadinessInput,
  rules = DEFAULT_READINESS_RULES,
): ReadinessResult {
  const checks: ReadinessCheck[] = [];
  let score = 0;

  const imagesOk = input.imageCount >= rules.minImages;
  checks.push({
    id: "image-count",
    status: imagesOk ? "pass" : "fail",
    message: imagesOk
      ? "Sufficient product images"
      : "Add at least one product photograph",
    severity: imagesOk ? "pass" : "error",
    points: imagesOk ? rules.countPoints : 0,
  });
  if (imagesOk) score += rules.countPoints;

  const resOk = Math.min(input.maxWidth, input.maxHeight) >= rules.minResolution;
  checks.push({
    id: "resolution",
    status: resOk ? "pass" : "warn",
    message: resOk
      ? "Sufficient image resolution"
      : `Increase resolution to at least ${rules.minResolution}px on the shortest side`,
    severity: resOk ? "pass" : "warning",
    points: resOk ? rules.resolutionPoints : 0,
  });
  if (resOk) score += rules.resolutionPoints;

  checks.push({
    id: "main-image",
    status: input.hasMainImage ? "pass" : "fail",
    message: input.hasMainImage ? "Main image selected" : "Set a main product image",
    severity: input.hasMainImage ? "pass" : "error",
    points: input.hasMainImage ? rules.mainImagePoints : 0,
  });
  if (input.hasMainImage) score += rules.mainImagePoints;

  const centered = input.productCentered !== false;
  checks.push({
    id: "centered",
    status: centered ? "pass" : "warn",
    message: centered ? "Product appears centered" : "Product may not be centered",
    severity: centered ? "pass" : "warning",
    points: centered ? rules.centeredPoints : 0,
  });
  if (centered) score += rules.centeredPoints;

  const bgOk = input.whiteBackgroundLikely !== false;
  checks.push({
    id: "background",
    status: bgOk ? "pass" : "warn",
    message: bgOk
      ? "Main background likely acceptable"
      : "Main background may need a pure white treatment",
    severity: bgOk ? "pass" : "warning",
    points: bgOk ? rules.backgroundPoints : 0,
  });
  if (bgOk) score += rules.backgroundPoints;

  const copyReady =
    input.hasTitle !== false &&
    input.hasBullets !== false &&
    input.hasDescription !== false &&
    input.hasKeywords !== false;
  checks.push({
    id: "copy",
    status: copyReady ? "pass" : "warn",
    message: copyReady
      ? "Listing copy is present"
      : "Complete title, bullets, description and keywords",
    severity: copyReady ? "pass" : "warning",
    points: copyReady ? rules.copyPoints : 0,
  });
  if (copyReady) score += rules.copyPoints;

  if (input.promotionalTextOnMain) {
    score = Math.max(0, score - rules.promoPenalty);
    checks.push({
      id: "promo-text",
      status: "warn",
      message: "Promotional text detected on marketplace main image",
      severity: "warning",
      points: -rules.promoPenalty,
    });
  } else {
    checks.push({
      id: "promo-text",
      status: "pass",
      message: "No promotional text flagged on the main image",
      severity: "pass",
      points: 0,
    });
  }

  if (input.dimensionsVerified === false) {
    score = Math.max(0, score - rules.dimensionsPenalty);
    checks.push({
      id: "dimensions",
      status: "warn",
      message: "Dimensions require seller verification",
      severity: "warning",
      points: -rules.dimensionsPenalty,
    });
  } else {
    checks.push({
      id: "visible",
      status: "pass",
      message: "Product visible",
      severity: "pass",
      points: 0,
    });
  }

  score = Math.max(0, Math.min(100, score));
  const label = score >= 85 ? "Excellent" : score >= 70 ? "Good" : score >= 50 ? "Needs work" : "Not ready";
  return { score, label, checks };
}
