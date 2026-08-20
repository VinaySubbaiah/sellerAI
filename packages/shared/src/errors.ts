export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const ErrorCodes = {
  UNAUTHENTICATED: "UNAUTHENTICATED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION: "VALIDATION",
  INSUFFICIENT_CREDITS: "INSUFFICIENT_CREDITS",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  UNSUPPORTED_IMAGE: "UNSUPPORTED_IMAGE",
  AI_UNAVAILABLE: "AI_UNAVAILABLE",
  GENERATION_FAILED: "GENERATION_FAILED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  CONFIG: "CONFIG",
} as const;
