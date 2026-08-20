import sharp from "sharp";
import { getBackgroundRemoval } from "./bg-removal.js";
import { getAiProviders } from "./ai/factory.js";

export async function whiteBackground(productPng: Buffer, size = 1600): Promise<Buffer> {
  const padded = await centerOnCanvas(productPng, size, size);
  const canvas = sharp({
    create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } },
  }).png();
  const shadow = await makeShadow(padded, size);
  return canvas
    .composite([
      { input: shadow, blend: "over" },
      { input: padded, blend: "over" },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function compositeOnBackground(productPng: Buffer, background: Buffer, size = 1600) {
  const bg = await sharp(background).resize(size, size, { fit: "cover" }).toBuffer();
  const product = await centerOnCanvas(productPng, size, size, 0.72);
  const shadow = await makeShadow(product, size);
  return sharp(bg)
    .composite([
      { input: shadow, blend: "over" },
      { input: product, blend: "over" },
    ])
    .jpeg({ quality: 92 })
    .toBuffer();
}

export async function centerOnCanvas(input: Buffer, width: number, height: number, scale = 0.82) {
  const resized = await sharp(input)
    .resize(Math.round(width * scale), Math.round(height * scale), { fit: "inside" })
    .png()
    .toBuffer();
  const meta = await sharp(resized).metadata();
  const left = Math.max(0, Math.round((width - (meta.width ?? width)) / 2));
  const top = Math.max(0, Math.round((height - (meta.height ?? height)) / 2));
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .png()
    .composite([{ input: resized, left, top }])
    .toBuffer();
}

export async function makeShadow(productPng: Buffer, size: number) {
  const blur = await sharp(productPng)
    .resize(size, size)
    .extractChannel("alpha")
    .blur(18)
    .toBuffer();
  return sharp(blur)
    .resize(size, Math.round(size * 0.35))
    .extend({ top: Math.round(size * 0.58), bottom: 0, left: 0, right: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer()
    .then((buf) =>
      sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
        .composite([{ input: buf, blend: "multiply" }])
        .png()
        .toBuffer(),
    );
}

export async function extractProduct(input: Buffer) {
  return getBackgroundRemoval().removeBackground(input);
}

export async function lifestyleScene(prompt: string, size = 1600) {
  return getAiProviders().image.generateBackground(prompt, size, size);
}

export async function enhanceLighting(input: Buffer) {
  return sharp(input).modulate({ brightness: 1.06, saturation: 1.05 }).sharpen().jpeg({ quality: 92 }).toBuffer();
}

export async function cropResize(input: Buffer, width: number, height: number) {
  return sharp(input).resize(width, height, { fit: "cover", position: "centre" }).jpeg({ quality: 92 }).toBuffer();
}

export const PRESET_SIZES: Record<string, [number, number]> = {
  AMAZON: [1600, 1600],
  FLIPKART: [1600, 1600],
  MEESHO: [1080, 1080],
  INSTAGRAM_POST: [1080, 1080],
  INSTAGRAM_STORY: [1080, 1920],
  WHATSAPP_STATUS: [1080, 1920],
};
