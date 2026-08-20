import { GoogleGenerativeAI } from "@google/generative-ai";
import { AppError, ErrorCodes } from "@sellerstudio/shared";
import { GeminiImageProvider, GeminiTextProvider } from "./gemini.js";
import { MockImageProvider, MockTextProvider } from "./mock.js";
import type { AiProviders } from "./types.js";

export function getAiProviders(): AiProviders {
  const provider = process.env.AI_PROVIDER ?? "mock";
  const textModel = process.env.TEXT_MODEL ?? "gemini-3.7-flash";
  const imageModel = process.env.IMAGE_MODEL ?? "gemini-3.1-flash-lite-image";
  if (provider === "mock") {
    return {
      text: new MockTextProvider(),
      image: new MockImageProvider(),
      providerName: "mock",
      textModel: "mock-text",
      imageModel: "mock-image",
    };
  }
  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new AppError(ErrorCodes.CONFIG, "GEMINI_API_KEY is required when AI_PROVIDER=gemini", 500);
    }
    const client = new GoogleGenerativeAI(key);
    return {
      text: new GeminiTextProvider(client, textModel),
      image: new GeminiImageProvider(client, process.env.PREMIUM_IMAGE_MODEL || imageModel),
      providerName: "gemini",
      textModel,
      imageModel,
    };
  }
  throw new AppError(ErrorCodes.CONFIG, `Unknown AI_PROVIDER: ${provider}`, 500);
}
