import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import archiver from "archiver";
import { DEFAULT_CREDIT_COSTS, scoreReadiness } from "@sellerstudio/shared";
import { prisma } from "./prisma.js";
import { logger } from "./logger.js";
import { getStorage, objectKey } from "./storage.js";
import { consumeReservation, refundReservation } from "./credits-ledger.js";
import { getAiProviders } from "./ai/factory.js";
import { extractProduct, whiteBackground, compositeOnBackground, lifestyleScene, enhanceLighting, cropResize, PRESET_SIZES } from "./image-pipeline.js";
import { formatSize, renderInfographic, renderMarketingCreative } from "./marketing-templates.js";
import { renderReel } from "./reel.js";

export async function processGenerationJob(jobId: string) {
  const job = await prisma.generationJob.findUnique({ where: { id: jobId } });
  if (!job) return;
  if (job.status === "COMPLETED" || job.status === "CANCELLED") return;
  if (job.status === "FAILED" && job.retryCount >= 3) return;

  const started = new Date();
  await prisma.generationJob.update({
    where: { id: jobId },
    data: { status: "PROCESSING", startedAt: job.startedAt ?? started, progress: 5 },
  });
  if (job.projectId) {
    await prisma.project.update({ where: { id: job.projectId }, data: { status: "PROCESSING" } });
  }

  try {
    const payload = (job.payload ?? {}) as Record<string, unknown>;
    switch (job.type) {
      case "ANALYZE_PRODUCT":
        await runAnalyze(job.id, job.userId, job.productId!, payload);
        break;
      case "LISTING_PACK":
        await runListing(job);
        break;
      case "PRODUCT_PHOTOS":
        await runPhotos(job);
        break;
      case "MARKETING":
        await runMarketing(job);
        break;
      case "PHOTO_EDIT":
        await runEdit(job);
        break;
      case "ANIMATED_REEL":
        await runReel(job);
        break;
      case "ZIP_EXPORT":
        await runZip(job);
        break;
      default:
        throw new Error(`Unknown job type ${job.type}`);
    }

    await consumeReservation(prisma, job.userId, job.creditsReserved, job.id);
    await prisma.generationJob.update({
      where: { id: job.id },
      data: {
        status: "COMPLETED",
        progress: 100,
        completedAt: new Date(),
        creditsConsumed: job.creditsReserved,
      },
    });
    if (job.projectId) {
      await prisma.project.update({ where: { id: job.projectId }, data: { status: "COMPLETED" } });
    }
    await prisma.notification.create({
      data: {
        userId: job.userId,
        title: "Generation complete",
        body: "Your project finished processing and is ready to review.",
      },
    });
    logger.info({ jobId: job.id, userId: job.userId, productId: job.productId, status: "COMPLETED" }, "job complete");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation failed";
    logger.error({ jobId, err: message, retryCount: job.retryCount }, "job failed");
    const attempts = job.retryCount + 1;
    const giveUp = attempts >= 3;
    if (giveUp) {
      await refundReservation(prisma, job.userId, job.creditsReserved, job.id);
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error: message, retryCount: attempts, completedAt: new Date(), progress: 100 },
      });
      if (job.projectId) {
        await prisma.project.update({ where: { id: job.projectId }, data: { status: "FAILED" } });
      }
    } else {
      await prisma.generationJob.update({
        where: { id: job.id },
        data: { status: "QUEUED", error: message, retryCount: attempts },
      });
      throw error;
    }
  }
}

async function mainProductBuffer(productId: string) {
  const image = await prisma.productImage.findFirst({
    where: { productId },
    orderBy: [{ isMain: "desc" }, { sortOrder: "asc" }],
  });
  if (!image) throw new Error("Product has no images");
  return getStorage().getObject(image.storageKey);
}

async function saveAsset(opts: {
  projectId: string;
  jobId: string;
  userId: string;
  type: string;
  buffer: Buffer;
  mime: string;
  ext: string;
  width?: number;
  height?: number;
}) {
  const key = objectKey(opts.userId, "generated", `${opts.type}.${opts.ext}`);
  await getStorage().putObject(key, opts.buffer, opts.mime);
  return prisma.generatedAsset.create({
    data: {
      projectId: opts.projectId,
      jobId: opts.jobId,
      type: opts.type,
      storageKey: key,
      mime: opts.mime,
      width: opts.width,
      height: opts.height,
    },
  });
}

async function runAnalyze(jobId: string, userId: string, productId: string, _payload: Record<string, unknown>) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");
  const ai = getAiProviders();
  const started = Date.now();
  const analysis = await ai.text.analyzeProduct({
    name: product.name,
    category: product.category,
    description: product.description,
  });
  await prisma.productSpecification.upsert({
    where: { productId },
    update: { aiSuggestion: analysis as object, analysisWarnings: analysis.warnings },
    create: { productId, aiSuggestion: analysis as object, analysisWarnings: analysis.warnings },
  });
  await prisma.aiUsageLog.create({
    data: {
      userId,
      jobId,
      provider: ai.providerName,
      model: ai.textModel,
      durationMs: Date.now() - started,
    },
  });
  await prisma.generationJob.update({ where: { id: jobId }, data: { progress: 90, provider: ai.providerName, model: ai.textModel } });
}

async function runListing(job: { id: string; userId: string; productId: string | null; projectId: string | null; payload: unknown }) {
  if (!job.productId || !job.projectId) throw new Error("Listing job missing product/project");
  const payload = job.payload as {
    platform: string;
    language: string;
    style: string;
    assets: string[];
    preserveProduct: boolean;
  };
  const product = await prisma.product.findUnique({
    where: { id: job.productId },
    include: { specification: true, images: true },
  });
  if (!product) throw new Error("Product not found");
  const brand = await prisma.brand.findUnique({ where: { userId: job.userId } });
  const confirmed = (product.specification?.confirmed as Record<string, unknown>) ?? {
    productName: product.name,
    category: product.category,
  };
  const ai = getAiProviders();
  await prisma.generationJob.update({ where: { id: job.id }, data: { progress: 15, provider: ai.providerName, model: ai.textModel } });
  const listing = await ai.text.generateListing({
    confirmed,
    brand: brand ? { name: brand.name, style: brand.style, defaultCta: brand.defaultCta } : null,
    platform: payload.platform,
    language: payload.language,
    style: payload.style,
  });
  await prisma.listingContent.upsert({
    where: { projectId: job.projectId },
    update: {
      title: listing.title,
      bulletPoints: listing.bulletPoints,
      description: listing.description,
      keywords: listing.keywords,
      warnings: listing.warnings,
      requiresUserInput: listing.requiresUserInput,
    },
    create: {
      projectId: job.projectId,
      title: listing.title,
      bulletPoints: listing.bulletPoints,
      description: listing.description,
      keywords: listing.keywords,
      warnings: listing.warnings,
      requiresUserInput: listing.requiresUserInput,
    },
  });

  const source = await mainProductBuffer(product.id);
  const cutout = await extractProduct(source);
  const assets = payload.assets?.length ? payload.assets : ["MAIN_IMAGE", "LIFESTYLE", "FEATURE"];
  let i = 0;
  for (const kind of assets) {
    i += 1;
    let buffer: Buffer;
    if (kind === "MAIN_IMAGE") {
      buffer = await whiteBackground(cutout);
    } else if (kind === "LIFESTYLE") {
      const scene = await lifestyleScene(`empty ${brand?.style ?? "minimal"} lifestyle surface, no product, no text`, 1600);
      buffer = await compositeOnBackground(cutout, scene);
    } else {
      buffer = await renderInfographic({
        product: cutout,
        title: String(confirmed.productName ?? product.name),
        lines: listing.bulletPoints.slice(0, 5),
        kind,
        primary: brand?.primaryColor ?? "#4F46E5",
      });
    }
    await saveAsset({
      projectId: job.projectId,
      jobId: job.id,
      userId: job.userId,
      type: kind,
      buffer,
      mime: "image/jpeg",
      ext: "jpg",
      width: 1600,
      height: kind === "LIFESTYLE" || kind === "MAIN_IMAGE" ? 1600 : 1600,
    });
    await prisma.generationJob.update({
      where: { id: job.id },
      data: { progress: Math.min(90, 20 + Math.round((i / assets.length) * 70)) },
    });
  }

  const main = product.images.find((im) => im.isMain) ?? product.images[0];
  const result = scoreReadiness({
    imageCount: product.images.length,
    maxWidth: main?.width ?? 0,
    maxHeight: main?.height ?? 0,
    hasMainImage: Boolean(main),
    hasTitle: Boolean(listing.title),
    hasBullets: listing.bulletPoints.length >= 5,
    hasDescription: Boolean(listing.description),
    hasKeywords: listing.keywords.length > 0,
    dimensionsVerified: Boolean((confirmed as { dimensions?: unknown }).dimensions),
    promotionalTextOnMain: false,
  });
  await prisma.listingReadinessCheck.create({
    data: {
      productId: product.id,
      projectId: job.projectId,
      score: result.score,
      label: result.label,
      checks: result.checks as object[],
    },
  });
}

async function runPhotos(job: { id: string; userId: string; productId: string | null; projectId: string | null; payload: unknown }) {
  if (!job.productId || !job.projectId) throw new Error("Photo job missing ids");
  const payload = job.payload as { styles: string[]; count: number; preserveProduct: boolean };
  const source = await mainProductBuffer(job.productId);
  const cutout = await extractProduct(source);
  const styles = (payload.styles?.length ? payload.styles : ["PURE_WHITE"]).slice(0, payload.count ?? 1);
  for (let i = 0; i < styles.length; i++) {
    const style = styles[i]!;
    let buffer: Buffer;
    if (style === "PURE_WHITE") {
      buffer = await whiteBackground(cutout);
    } else {
      const scene = await lifestyleScene(`empty ${style.toLowerCase()} photography backdrop, no product, no text`, 1600);
      buffer = await compositeOnBackground(cutout, scene);
    }
    await saveAsset({
      projectId: job.projectId,
      jobId: job.id,
      userId: job.userId,
      type: `PHOTO_${style}`,
      buffer,
      mime: "image/jpeg",
      ext: "jpg",
      width: 1600,
      height: 1600,
    });
    await prisma.generationJob.update({ where: { id: job.id }, data: { progress: Math.round(((i + 1) / styles.length) * 90) } });
  }
}

async function runMarketing(job: { id: string; userId: string; productId: string | null; projectId: string | null; payload: unknown }) {
  if (!job.productId || !job.projectId) throw new Error("Marketing job missing ids");
  const payload = job.payload as {
    headline: string;
    offer: string;
    cta: string;
    price?: string;
    format: string;
    variants?: string[];
  };
  const brand = await prisma.brand.findUnique({ where: { userId: job.userId } });
  const source = await mainProductBuffer(job.productId);
  const cutout = await extractProduct(source);
  const [w, h] = formatSize(payload.format);
  const variants = payload.variants?.length ? payload.variants : ["PREMIUM", "BOLD", "MINIMAL"];
  let logo: Buffer | null = null;
  if (brand?.logoKey) {
    try {
      logo = await getStorage().getObject(brand.logoKey);
    } catch {
      logo = null;
    }
  }
  for (const variant of variants) {
    const buffer = await renderMarketingCreative({
      product: cutout,
      headline: payload.headline,
      offer: payload.offer,
      cta: payload.cta || brand?.defaultCta || "Shop now",
      price: payload.price,
      brandName: brand?.name ?? "Brand",
      primary: brand?.primaryColor ?? "#4F46E5",
      secondary: brand?.secondaryColor ?? "#2563EB",
      logo,
      variant: variant as "PREMIUM" | "BOLD" | "MINIMAL",
      width: w,
      height: h,
    });
    await saveAsset({
      projectId: job.projectId,
      jobId: job.id,
      userId: job.userId,
      type: `MARKETING_${variant}`,
      buffer,
      mime: "image/png",
      ext: "png",
      width: w,
      height: h,
    });
  }
}

async function runEdit(job: { id: string; userId: string; productId: string | null; projectId: string | null; payload: unknown }) {
  if (!job.productId || !job.projectId) throw new Error("Edit job missing ids");
  const payload = job.payload as { tool: string; preset?: string };
  const source = await mainProductBuffer(job.productId);
  let buffer: Buffer;
  if (payload.tool === "REMOVE_BACKGROUND" || payload.tool === "TRANSPARENT_BACKGROUND") {
    buffer = await extractProduct(source);
    await saveAsset({ projectId: job.projectId, jobId: job.id, userId: job.userId, type: "TRANSPARENT", buffer, mime: "image/png", ext: "png" });
    return;
  }
  if (payload.tool === "WHITE_BACKGROUND") {
    buffer = await whiteBackground(await extractProduct(source));
  } else if (payload.tool === "AI_BACKGROUND") {
    const scene = await lifestyleScene("empty branded scene, no product, no text", 1600);
    buffer = await compositeOnBackground(await extractProduct(source), scene);
  } else if (payload.tool === "ENHANCE" || payload.tool === "LIGHTING") {
    buffer = await enhanceLighting(source);
  } else if (payload.preset && PRESET_SIZES[payload.preset]) {
    const [w, h] = PRESET_SIZES[payload.preset]!;
    buffer = await cropResize(source, w, h);
  } else if (payload.tool === "CENTER") {
    buffer = await whiteBackground(await extractProduct(source));
  } else {
    buffer = await enhanceLighting(source);
  }
  await saveAsset({ projectId: job.projectId, jobId: job.id, userId: job.userId, type: `EDIT_${payload.tool}`, buffer, mime: "image/jpeg", ext: "jpg" });
}

async function runReel(job: { id: string; userId: string; productId: string | null; projectId: string | null; payload: unknown }) {
  if (!job.productId || !job.projectId) throw new Error("Reel job missing ids");
  const payload = job.payload as {
    durationSec: 5 | 10;
    style: string;
    headline: string;
    offer: string;
    cta: string;
    withText: boolean;
  };
  const images = await prisma.productImage.findMany({ where: { productId: job.productId }, orderBy: { sortOrder: "asc" } });
  const frames: Buffer[] = [];
  for (const img of images.slice(0, 4)) {
    frames.push(await getStorage().getObject(img.storageKey));
  }
  if (!frames.length) throw new Error("No frames for reel");
  const mp4 = await renderReel({
    frames,
    durationSec: payload.durationSec === 10 ? 10 : 5,
    headline: payload.headline,
    offer: payload.offer,
    cta: payload.cta,
    style: payload.style,
    withText: payload.withText !== false,
  });
  await saveAsset({
    projectId: job.projectId,
    jobId: job.id,
    userId: job.userId,
    type: "REEL",
    buffer: mp4,
    mime: "video/mp4",
    ext: "mp4",
    width: 1080,
    height: 1920,
  });
}

async function runZip(job: { id: string; userId: string; projectId: string | null }) {
  if (!job.projectId) throw new Error("ZIP job missing project");
  const assets = await prisma.generatedAsset.findMany({ where: { projectId: job.projectId } });
  const listing = await prisma.listingContent.findUnique({ where: { projectId: job.projectId } });
  const dir = await mkdtemp(join(tmpdir(), "zip-"));
  const zipPath = join(dir, "pack.zip");
  await new Promise<void>((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip");
    output.on("close", () => resolve());
    archive.on("error", reject);
    archive.pipe(output);
    void (async () => {
      for (const asset of assets) {
        const buf = await getStorage().getObject(asset.storageKey);
        const ext = asset.mime.includes("mp4") ? "mp4" : asset.mime.includes("png") ? "png" : "jpg";
        archive.append(buf, { name: `${asset.type}.${ext}` });
      }
      if (listing) {
        archive.append(
          JSON.stringify(
            {
              title: listing.title,
              bulletPoints: listing.bulletPoints,
              description: listing.description,
              keywords: listing.keywords,
            },
            null,
            2,
          ),
          { name: "listing.json" },
        );
      }
      await archive.finalize();
    })().catch(reject);
  });
  const { readFile } = await import("node:fs/promises");
  const zip = await readFile(zipPath);
  const key = objectKey(job.userId, "zips", "project.zip");
  await getStorage().putObject(key, zip, "application/zip");
  await prisma.project.update({ where: { id: job.projectId }, data: { zipKey: key } });
  await rm(dir, { recursive: true, force: true });
}

void DEFAULT_CREDIT_COSTS;
void mkdir;
