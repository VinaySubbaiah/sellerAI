import type { ListingContentPayload, ProductAnalysis } from "@sellerstudio/shared";

export interface AiTextProvider {
  analyzeProduct(input: {
    name: string;
    category: string;
    description?: string | null;
  }): Promise<ProductAnalysis>;
  generateListing(input: {
    confirmed: Record<string, unknown>;
    brand?: Record<string, unknown> | null;
    platform: string;
    language: string;
    style: string;
  }): Promise<ListingContentPayload>;
}

export interface AiImageProvider {
  generateBackground(prompt: string, width: number, height: number): Promise<Buffer>;
}

export interface AiProviders {
  text: AiTextProvider;
  image: AiImageProvider;
  providerName: string;
  textModel: string;
  imageModel: string;
}
