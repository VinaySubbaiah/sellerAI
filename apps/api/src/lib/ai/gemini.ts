import { GoogleGenerativeAI } from "@google/generative-ai";
import { listingContentSchema, parseAiJson, productAnalysisSchema, type ListingContentPayload, type ProductAnalysis } from "@sellerstudio/shared";
import type { AiImageProvider, AiTextProvider } from "./types.js";
import { MockImageProvider } from "./mock.js";

export class GeminiTextProvider implements AiTextProvider {
  constructor(
    private readonly client: GoogleGenerativeAI,
    private readonly model: string,
  ) {}

  async analyzeProduct(input: { name: string; category: string; description?: string | null }) {
    const model = this.client.getGenerativeModel({ model: this.model });
    const prompt = `You analyze e-commerce product photos for listing assistance.
Return ONLY JSON matching:
{"productName":"","category":"","colors":[],"possibleFeatures":[],"possibleMaterial":null,"confidenceNotes":[],"warnings":[],"requiresConfirmation":[]}
Never invent dimensions, materials, ingredients, warranty, certifications, capacity, compatibility, medical or performance claims.
Treat visual guesses as unconfirmed. Product name: ${input.name}. Category: ${input.category}. Description: ${input.description ?? ""}.`;
    const result = await model.generateContent(prompt);
    return parseAiJson(result.response.text(), productAnalysisSchema) as ProductAnalysis;
  }

  async generateListing(input: {
    confirmed: Record<string, unknown>;
    brand?: Record<string, unknown> | null;
    platform: string;
    language: string;
    style: string;
  }) {
    const model = this.client.getGenerativeModel({ model: this.model });
    const prompt = `Write marketplace listing copy from SELLER-CONFIRMED facts only.
Do not invent specifications. If important facts are missing, add them to requiresUserInput.
Language: ${input.language}. Platform: ${input.platform}. Style: ${input.style}.
Confirmed JSON: ${JSON.stringify(input.confirmed)}
Brand JSON: ${JSON.stringify(input.brand ?? {})}
Return ONLY JSON:
{"title":"","bulletPoints":["","","","",""],"description":"","keywords":[],"warnings":[],"requiresUserInput":[]}`;
    const result = await model.generateContent(prompt);
    return parseAiJson(result.response.text(), listingContentSchema) as ListingContentPayload;
  }
}

export class GeminiImageProvider implements AiImageProvider {
  constructor(
    private readonly client: GoogleGenerativeAI,
    private readonly model: string,
  ) {}

  async generateBackground(prompt: string, width: number, height: number) {
    try {
      const model = this.client.getGenerativeModel({ model: this.model });
      const result = await model.generateContent(
        `Generate an EMPTY product photography background only. No product, no people, no text, no logos. ${prompt}. Aspect ${width}x${height}.`,
      );
      const parts = result.response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        const inline = (part as { inlineData?: { data?: string } }).inlineData;
        if (inline?.data) return Buffer.from(inline.data, "base64");
      }
    } catch {
      // Fall through to deterministic background so jobs still complete.
    }
    return new MockImageProvider().generateBackground(prompt, width, height);
  }
}
