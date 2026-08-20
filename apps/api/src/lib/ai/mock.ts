import type { ListingContentPayload, ProductAnalysis } from "@sellerstudio/shared";
import sharp from "sharp";
import type { AiImageProvider, AiTextProvider } from "./types.js";

export class MockTextProvider implements AiTextProvider {
  async analyzeProduct(input: { name: string; category: string; description?: string | null }): Promise<ProductAnalysis> {
    return {
      productName: input.name,
      category: input.category,
      colors: ["black", "silver"],
      possibleFeatures: ["Portable", "Everyday use", "Gift-ready packaging"],
      possibleMaterial: null,
      confidenceNotes: ["Visual analysis is a suggestion only. Confirm specifications before publishing."],
      warnings: [
        "Do not treat detected materials, dimensions or performance claims as confirmed facts.",
      ],
      suggestedTitle: input.name,
      requiresConfirmation: ["dimensions", "materials", "warranty"],
    };
  }

  async generateListing(input: {
    confirmed: Record<string, unknown>;
    platform: string;
    language: string;
    style: string;
  }): Promise<ListingContentPayload> {
    const name = String(input.confirmed.productName ?? input.confirmed.name ?? "Product");
    const category = String(input.confirmed.category ?? "General");
    const missing: string[] = [];
    if (!input.confirmed.dimensions) missing.push("dimensions");
    const title = `${name} | ${category} | ${input.platform} ready`;
    return {
      title: title.slice(0, 180),
      bulletPoints: [
        `${name} for ${category.toLowerCase()} sellers`,
        "Created from seller-confirmed product information only",
        `${input.style} presentation suitable for ${input.platform}`,
        "Verify specifications against the physical product before publishing",
        "Packaging and accessories as shown in your uploaded photographs",
      ],
      description: `${name} is listed using details you confirmed. No unstated technical claims are added. Review marketplace policies before you publish.`,
      keywords: [name.toLowerCase(), category.toLowerCase(), input.platform.toLowerCase(), "sellerstudio"],
      warnings: ["AI-generated copy must be reviewed by the seller."],
      requiresUserInput: missing,
    };
  }
}

export class MockImageProvider implements AiImageProvider {
  async generateBackground(prompt: string, width: number, height: number): Promise<Buffer> {
    const hue = Math.abs(hash(prompt)) % 360;
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="hsl(${hue}, 18%, 92%)"/>
          <stop offset="100%" stop-color="hsl(${(hue + 40) % 360}, 22%, 84%)"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <ellipse cx="${width * 0.5}" cy="${height * 0.78}" rx="${width * 0.28}" ry="${height * 0.08}" fill="#cbd5e1" opacity="0.45"/>
    </svg>`;
    return sharp(Buffer.from(svg)).png().toBuffer();
  }
}

function hash(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0;
  return h;
}
