import { Body, Controller, Get, Param, Post, Module } from "@nestjs/common";
import { IsObject, IsOptional, IsString } from "class-validator";
import { AppError, ErrorCodes, calculateJobCredits, canAfford, assertOwned } from "@sellerstudio/shared";
import { CurrentUser } from "../../common/current-user.js";
import type { AuthedUser } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { enqueueGeneration } from "../../lib/queue.js";
import { processGenerationJob } from "../../lib/generation-processor.js";
import { reserveCredits } from "../../lib/credits-ledger.js";

class CreateJobDto {
  @IsString()
  type!: string;
  @IsOptional()
  @IsString()
  productId?: string;
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}

@Controller("generation")
export class GenerationController {
  @Post("jobs")
  async create(@CurrentUser() user: AuthedUser, @Body() body: CreateJobDto) {
    const costsRows = await prisma.creditCostConfig.findMany();
    const costs: Record<string, number> = {};
    for (const row of costsRows) costs[row.key] = row.credits;
    const photoCount = Number(body.payload?.count ?? body.payload?.photoCount ?? 1);
    const credits = calculateJobCredits({
      jobType: body.type,
      photoCount,
      useAiBackground: body.payload?.tool === "AI_BACKGROUND",
      costs: Object.keys(costs).length ? costs : undefined,
    });
    const wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
    if (!canAfford(wallet?.balance ?? 0, credits)) {
      throw new AppError(ErrorCodes.INSUFFICIENT_CREDITS, "Insufficient credits", 402);
    }
    if (body.productId) {
      assertOwned(await prisma.product.findUnique({ where: { id: body.productId } }), user.id, "Product");
    }
    const projectType =
      body.type === "LISTING_PACK"
        ? "LISTING"
        : body.type === "PRODUCT_PHOTOS"
          ? "PRODUCT_PHOTOS"
          : body.type === "MARKETING"
            ? "MARKETING"
            : body.type === "PHOTO_EDIT"
              ? "PHOTO_EDIT"
              : body.type === "ANIMATED_REEL"
                ? "ANIMATED_REEL"
                : "LISTING";
    const result = await prisma.$transaction(async (tx) => {
      const project = ["ANALYZE_PRODUCT", "ZIP_EXPORT"].includes(body.type)
        ? null
        : await tx.project.create({
            data: {
              userId: user.id,
              productId: body.productId,
              type: projectType,
              title: `${body.type} ${new Date().toISOString().slice(0, 10)}`,
              status: "QUEUED",
              metadata: body.payload as object,
            },
          });
      const job = await tx.generationJob.create({
        data: {
          userId: user.id,
          productId: body.productId,
          projectId: project?.id,
          type: body.type,
          payload: (body.payload ?? {}) as object,
          creditsReserved: credits,
          status: "QUEUED",
        },
      });
      return { job, project };
    });
    await reserveCredits(prisma, user.id, credits, result.job.id);
    try {
      await enqueueGeneration(result.job.id);
    } catch {
      await processGenerationJob(result.job.id);
    }
    return result;
  }

  @Get("jobs/:id")
  async get(@CurrentUser() user: AuthedUser, @Param("id") id: string) {
    const job = await prisma.generationJob.findUnique({ where: { id }, include: { assets: true } });
    return assertOwned(job, user.id, "Job");
  }

  @Post("jobs/:id/retry")
  async retry(@CurrentUser() user: AuthedUser, @Param("id") id: string) {
    const job = assertOwned(await prisma.generationJob.findUnique({ where: { id } }), user.id, "Job");
    if (job.status !== "FAILED") throw new AppError(ErrorCodes.VALIDATION, "Only failed jobs can be retried");
    await prisma.generationJob.update({ where: { id: job.id }, data: { status: "QUEUED", error: null, progress: 0 } });
    try {
      await enqueueGeneration(job.id);
    } catch {
      await processGenerationJob(job.id);
    }
    return { ok: true };
  }
}

@Module({ controllers: [GenerationController] })
export class GenerationModule {}
