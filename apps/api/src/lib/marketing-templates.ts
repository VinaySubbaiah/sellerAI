import sharp from "sharp";

export interface CreativeInput {
  product: Buffer;
  headline: string;
  offer: string;
  cta: string;
  price?: string;
  brandName: string;
  primary: string;
  secondary: string;
  logo?: Buffer | null;
  variant: "PREMIUM" | "BOLD" | "MINIMAL";
  width: number;
  height: number;
}

function escapeXml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function renderMarketingCreative(input: CreativeInput): Promise<Buffer> {
  const { width, height, variant } = input;
  const bg =
    variant === "BOLD"
      ? input.primary
      : variant === "MINIMAL"
        ? "#ffffff"
        : input.secondary;
  const fg = variant === "MINIMAL" ? "#111827" : "#ffffff";
  const product = await sharp(input.product)
    .resize(Math.round(width * 0.7), Math.round(height * 0.45), { fit: "inside" })
    .png()
    .toBuffer();
  const productMeta = await sharp(product).metadata();
  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="${bg}"/>
    <rect x="48" y="48" width="${width - 96}" height="${height - 96}" rx="36" fill="${variant === "MINIMAL" ? "#F8FAFC" : "rgba(255,255,255,0.08)"}"/>
    <text x="80" y="120" font-size="28" font-family="sans-serif" fill="${fg}" opacity="0.85">${escapeXml(input.brandName)}</text>
    <text x="80" y="${height - 220}" font-size="${Math.round(width / 18)}" font-weight="700" font-family="sans-serif" fill="${fg}">${escapeXml(input.headline.slice(0, 42))}</text>
    <text x="80" y="${height - 150}" font-size="${Math.round(width / 22)}" font-family="sans-serif" fill="${variant === "BOLD" ? "#FDE68A" : input.primary}">${escapeXml(input.offer.slice(0, 48))}</text>
    ${input.price ? `<text x="80" y="${height - 100}" font-size="28" font-family="sans-serif" fill="${fg}">${escapeXml(input.price)}</text>` : ""}
    <rect x="${width - 280}" y="${height - 110}" width="200" height="54" rx="14" fill="${variant === "MINIMAL" ? input.primary : "#ffffff"}"/>
    <text x="${width - 180}" y="${height - 74}" text-anchor="middle" font-size="20" font-weight="700" font-family="sans-serif" fill="${variant === "MINIMAL" ? "#ffffff" : input.primary}">${escapeXml(input.cta.slice(0, 16))}</text>
  </svg>`);
  const base = await sharp(svg).png().toBuffer();
  const left = Math.round((width - (productMeta.width ?? 0)) / 2);
  const top = Math.round(height * 0.18);
  const composites: sharp.OverlayOptions[] = [{ input: product, left, top }];
  if (input.logo) {
    const logo = await sharp(input.logo).resize(96, 96, { fit: "inside" }).png().toBuffer();
    composites.push({ input: logo, left: 80, top: 40 });
  }
  return sharp(base).composite(composites).png().toBuffer();
}

export function formatSize(format: string): [number, number] {
  switch (format) {
    case "INSTAGRAM_STORY":
    case "WHATSAPP_STATUS":
      return [1080, 1920];
    case "WEBSITE_BANNER":
      return [1500, 500];
    case "FACEBOOK_POST":
      return [1200, 630];
    default:
      return [1080, 1080];
  }
}

export async function renderInfographic(opts: {
  product: Buffer;
  title: string;
  lines: string[];
  kind: string;
  primary: string;
}): Promise<Buffer> {
  const size = 1600;
  const product = await sharp(opts.product).resize(720, 720, { fit: "inside" }).png().toBuffer();
  const lines = opts.lines
    .slice(0, 5)
    .map(
      (line, i) =>
        `<text x="860" y="${520 + i * 70}" font-size="32" font-family="sans-serif" fill="#111827">${escapeXml(line)}</text>`,
    )
    .join("");
  const svg = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#ffffff"/>
    <rect x="0" y="0" width="16" height="${size}" fill="${opts.primary}"/>
    <text x="80" y="120" font-size="42" font-weight="700" font-family="sans-serif" fill="#111827">${escapeXml(opts.title)}</text>
    <text x="80" y="180" font-size="22" font-family="sans-serif" fill="#64748B">${escapeXml(opts.kind)}</text>
    ${lines}
  </svg>`);
  return sharp(svg)
    .composite([{ input: product, left: 80, top: 280 }])
    .jpeg({ quality: 92 })
    .toBuffer();
}
