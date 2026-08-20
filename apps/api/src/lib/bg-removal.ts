import sharp from "sharp";

export interface BackgroundRemovalProvider {
  removeBackground(input: Buffer): Promise<Buffer>;
}

/**
 * Commercial-safe heuristic cutout.
 * Samples corner colors and fades similar pixels to transparency.
 * License: original SellerStudio code (MIT with the repository).
 * For production-grade matting set BG_REMOVAL_PROVIDER=http and BG_REMOVAL_HTTP_URL
 * to a commercially licensed service you operate.
 */
export class HeuristicBackgroundRemoval implements BackgroundRemovalProvider {
  async removeBackground(input: Buffer): Promise<Buffer> {
    const image = sharp(input).ensureAlpha();
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    const w = info.width;
    const h = info.height;
    const corners = [
      sample(data, info, 2, 2),
      sample(data, info, w - 3, 2),
      sample(data, info, 2, h - 3),
      sample(data, info, w - 3, h - 3),
    ];
    const bg = average(corners);
    const out = Buffer.from(data);
    for (let i = 0; i < out.length; i += 4) {
      const dist = Math.hypot(out[i]! - bg[0], out[i + 1]! - bg[1], out[i + 2]! - bg[2]);
      if (dist < 42) {
        out[i + 3] = 0;
      } else if (dist < 64) {
        out[i + 3] = Math.round(((dist - 42) / 22) * 255);
      }
    }
    return sharp(out, { raw: { width: w, height: h, channels: 4 } }).png().toBuffer();
  }
}

export class HttpBackgroundRemoval implements BackgroundRemovalProvider {
  constructor(
    private readonly url: string,
    private readonly token?: string,
  ) {}

  async removeBackground(input: Buffer): Promise<Buffer> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: new Uint8Array(input),
    });
    if (!res.ok) throw new Error(`Background removal HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
}

export function getBackgroundRemoval(): BackgroundRemovalProvider {
  if (process.env.BG_REMOVAL_PROVIDER === "http" && process.env.BG_REMOVAL_HTTP_URL) {
    return new HttpBackgroundRemoval(process.env.BG_REMOVAL_HTTP_URL, process.env.BG_REMOVAL_HTTP_TOKEN);
  }
  return new HeuristicBackgroundRemoval();
}

function sample(data: Buffer, info: sharp.OutputInfo, x: number, y: number): [number, number, number] {
  const i = (y * info.width + x) * info.channels;
  return [data[i]!, data[i + 1]!, data[i + 2]!];
}

function average(colors: [number, number, number][]): [number, number, number] {
  const n = colors.length;
  return [
    Math.round(colors.reduce((s, c) => s + c[0], 0) / n),
    Math.round(colors.reduce((s, c) => s + c[1], 0) / n),
    Math.round(colors.reduce((s, c) => s + c[2], 0) / n),
  ];
}

export async function stripMetadata(input: Buffer): Promise<Buffer> {
  return sharp(input).rotate().withMetadata({}).toBuffer();
}

export async function probeImage(input: Buffer) {
  const meta = await sharp(input).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    mime: meta.format === "png" ? "image/png" : meta.format === "webp" ? "image/webp" : "image/jpeg",
  };
}
