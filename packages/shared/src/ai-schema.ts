import { z } from "zod";

export const productAnalysisSchema = z.object({
  productName: z.string().default(""),
  category: z.string().default(""),
  colors: z.array(z.string()).default([]),
  possibleFeatures: z.array(z.string()).default([]),
  possibleMaterial: z.string().nullable().default(null),
  confidenceNotes: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  suggestedTitle: z.string().optional(),
  requiresConfirmation: z.array(z.string()).default([]),
});

export type ProductAnalysis = z.infer<typeof productAnalysisSchema>;

export const listingContentSchema = z.object({
  title: z.string(),
  bulletPoints: z.array(z.string()).min(1).max(8),
  description: z.string(),
  keywords: z.array(z.string()),
  warnings: z.array(z.string()).default([]),
  requiresUserInput: z.array(z.string()).default([]),
});

export type ListingContentPayload = z.infer<typeof listingContentSchema>;

export function parseAiJson<T>(raw: string, schema: z.ZodType<T>): T {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("AI response did not contain JSON");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonMatch[0]);
  } catch {
    throw new Error("AI response JSON was malformed");
  }
  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`AI schema validation failed: ${result.error.message}`);
  }
  return result.data;
}
