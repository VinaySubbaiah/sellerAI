import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Module } from "@nestjs/common";
import { IsArray, IsEnum, IsInt, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { Platform } from "@prisma/client";
import { Type } from "class-transformer";
import { AppError, ErrorCodes, MAX_PRODUCT_IMAGES, assertOwned } from "@sellerstudio/shared";
import { CurrentUser } from "../../common/current-user.js";
import type { AuthedUser } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { getStorage, objectKey } from "../../lib/storage.js";
import { enqueueGeneration } from "../../lib/queue.js";
import { getAiProviders } from "../../lib/ai/factory.js";
import { probeImage, stripMetadata } from "../../lib/bg-removal.js";

class CreateProductDto {
  @IsString()
  @MaxLength(160)
  name!: string;
  @IsOptional()
  @IsString()
  brandName?: string;
  @IsString()
  category!: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sellingPrice?: number;
  @IsOptional()
  @IsString()
  description?: string;
  @IsArray()
  @IsEnum(Platform, { each: true })
  platforms!: Platform[];
}

class ConfirmDto {
  @IsOptional()
  @IsObject()
  confirmed?: Record<string, unknown>;
}

@Controller("products")
export class ProductsController {
  @Get()
  async list(
    @CurrentUser() user: AuthedUser,
    @Query("q") q?: string,
    @Query("platform") platform?: Platform,
  ) {
    const products = await prisma.product.findMany({
      where: {
        userId: user.id,
        archivedAt: null,
        name: q ? { contains: q, mode: "insensitive" } : undefined,
        platforms: platform ? { has: platform } : undefined,
      },
      include: { images: true, _count: { select: { projects: true, images: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return products;
  }

  @Post()
  create(@CurrentUser() user: AuthedUser, @Body() body: CreateProductDto) {
    return prisma.product.create({ data: { ...body, userId: user.id } });
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthedUser, @Param("id") id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        specification: true,
        projects: { orderBy: { createdAt: "desc" }, take: 20 },
        readinessChecks: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });
    return assertOwned(product, user.id, "Product");
  }

  @Patch(":id")
  async patch(@CurrentUser() user: AuthedUser, @Param("id") id: string, @Body() body: Partial<CreateProductDto>) {
    const product = assertOwned(await prisma.product.findUnique({ where: { id } }), user.id, "Product");
    return prisma.product.update({ where: { id: product.id }, data: body });
  }

  @Delete(":id")
  async archive(@CurrentUser() user: AuthedUser, @Param("id") id: string) {
    const product = assertOwned(await prisma.product.findUnique({ where: { id } }), user.id, "Product");
    return prisma.product.update({ where: { id: product.id }, data: { archivedAt: new Date() } });
  }

  @Post(":id/images/presign")
  async presign(
    @CurrentUser() user: AuthedUser,
    @Param("id") id: string,
    @Body() body: { filename: string; mime: string; bytes: number },
  ) {
    const product = assertOwned(await prisma.product.findUnique({ where: { id }, include: { images: true } }), user.id, "Product");
    if (product.images.length >= MAX_PRODUCT_IMAGES) {
      throw new AppError(ErrorCodes.VALIDATION, "Maximum 5 product images");
    }
    const allowed = (process.env.ALLOWED_IMAGE_MIME ?? "image/jpeg,image/png,image/webp").split(",");
    if (!allowed.includes(body.mime)) throw new AppError(ErrorCodes.UNSUPPORTED_IMAGE, "Unsupported image type");
    const max = Number(process.env.MAX_UPLOAD_BYTES ?? 10 * 1024 * 1024);
    if (body.bytes > max) throw new AppError(ErrorCodes.UNSUPPORTED_IMAGE, "File is too large");
    const key = objectKey(user.id, `products/${product.id}`, body.filename);
    const signed = await getStorage().presignUpload(key, body.mime);
    return { key, ...signed };
  }

  @Post(":id/images/complete")
  async complete(
    @CurrentUser() user: AuthedUser,
    @Param("id") id: string,
    @Body() body: { key: string; mime: string },
  ) {
    const product = assertOwned(await prisma.product.findUnique({ where: { id }, include: { images: true } }), user.id, "Product");
    if (!body.key.startsWith(`users/${user.id}/`)) throw new AppError(ErrorCodes.FORBIDDEN, "Invalid object key", 403);
    const storage = getStorage();
    const raw = await storage.getObject(body.key);
    const stripped = await stripMetadata(raw);
    await storage.putObject(body.key, stripped, body.mime);
    const probe = await probeImage(stripped);
    const isMain = product.images.length === 0;
    return prisma.productImage.create({
      data: {
        productId: product.id,
        storageKey: body.key,
        mime: body.mime,
        width: probe.width,
        height: probe.height,
        bytes: stripped.length,
        isMain,
        sortOrder: product.images.length,
      },
    });
  }

  @Delete(":id/images/:imageId")
  async removeImage(@CurrentUser() user: AuthedUser, @Param("id") id: string, @Param("imageId") imageId: string) {
    const product = assertOwned(await prisma.product.findUnique({ where: { id } }), user.id, "Product");
    const image = await prisma.productImage.findUnique({ where: { id: imageId } });
    if (!image || image.productId !== product.id) throw new AppError(ErrorCodes.NOT_FOUND, "Image not found", 404);
    await getStorage().deleteObject(image.storageKey).catch(() => undefined);
    await prisma.productImage.delete({ where: { id: imageId } });
    return { ok: true };
  }

  @Patch(":id/images/:imageId")
  async patchImage(
    @CurrentUser() user: AuthedUser,
    @Param("id") id: string,
    @Param("imageId") imageId: string,
    @Body() body: { isMain?: boolean },
  ) {
    const product = assertOwned(await prisma.product.findUnique({ where: { id } }), user.id, "Product");
    if (body.isMain) {
      await prisma.productImage.updateMany({ where: { productId: product.id }, data: { isMain: false } });
      await prisma.productImage.update({ where: { id: imageId }, data: { isMain: true } });
    }
    return prisma.productImage.findUnique({ where: { id: imageId } });
  }

  @Post(":id/analyze")
  async analyze(@CurrentUser() user: AuthedUser, @Param("id") id: string) {
    const product = assertOwned(await prisma.product.findUnique({ where: { id }, include: { images: true } }), user.id, "Product");
    if (!product.images.length) throw new AppError(ErrorCodes.VALIDATION, "Upload at least one image first");
    const job = await prisma.generationJob.create({
      data: {
        userId: user.id,
        productId: product.id,
        type: "ANALYZE_PRODUCT",
        payload: {},
        status: "QUEUED",
      },
    });
    try {
      await enqueueGeneration(job.id);
    } catch {
      const ai = getAiProviders();
      const analysis = await ai.text.analyzeProduct({
        name: product.name,
        category: product.category,
        description: product.description,
      });
      await prisma.productSpecification.upsert({
        where: { productId: product.id },
        update: { aiSuggestion: analysis as object, analysisWarnings: analysis.warnings },
        create: { productId: product.id, aiSuggestion: analysis as object, analysisWarnings: analysis.warnings },
      });
      await prisma.generationJob.update({ where: { id: job.id }, data: { status: "COMPLETED", progress: 100 } });
      return { jobId: job.id, analysis, inline: true };
    }
    return { jobId: job.id };
  }

  @Post(":id/confirm")
  async confirm(@CurrentUser() user: AuthedUser, @Param("id") id: string, @Body() body: ConfirmDto) {
    const product = assertOwned(await prisma.product.findUnique({ where: { id } }), user.id, "Product");
    return prisma.productSpecification.upsert({
      where: { productId: product.id },
      update: { confirmed: body.confirmed as object, confirmedAt: new Date() },
      create: { productId: product.id, confirmed: body.confirmed as object, confirmedAt: new Date() },
    });
  }
}

@Module({ controllers: [ProductsController] })
export class ProductsModule {}
