import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: {
    paths: [
      "req.headers.authorization",
      "password",
      "token",
      "razorpay_signature",
      "RAZORPAY_KEY_SECRET",
      "GEMINI_API_KEY",
      "FIREBASE_PRIVATE_KEY",
      "S3_SECRET_ACCESS_KEY",
    ],
    remove: true,
  },
});
