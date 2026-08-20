import { Body, Controller, Get, Param, Patch, Post, Query, Module } from "@nestjs/common";
import { ProjectType, JobStatus } from "@prisma/client";
import { IsOptional, IsString } from "class-validator";
import { assertOwned } from "@sellerstudio/shared";
import { CurrentUser } from "../../common/current-user.js";
import type { AuthedUser } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { getStorage } from "../../lib/storage.js";
import { enqueueGeneration } from "../../lib/queue.js";
import { processGenerationJob } from "../../lib/generation-processor.js";

class ListingPatchDto {
  @IsOptional()
  @IsString()
  title?: string;
  @IsOptional()
  description?: string;
  @IsOptional()
  bulletPoints?: string[];
  @IsOptional()
  keywords?: string[];
}

@Controller("projects")
export class ProjectsController {
  @Get()
  list(
    @CurrentUser() user: AuthedUser,
    @Query("type") type?: ProjectType,
    @Query("status") status?: JobStatus,
  ) {
    return prisma.project.findMany({
      where: { userId: user.id, type, status },
      include: { assets: true, product: true },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get(":id")
  async get(@CurrentUser() user: AuthedUser, @Param("id") id: string) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        assets: true,
        listingContent: true,
        jobs: true,
        product: { include: { readinessChecks: { orderBy: { createdAt: "desc" }, take: 1 } } },
      },
    });
    const owned = assertOwned(project, user.id, "Project");
    const assets = await Promise.all(
      owned.assets.map(async (asset) => ({
        ...asset,
        url: await getStorage().presignDownload(asset.storageKey),
      })),
    );
    return { ...owned, assets };
  }

  @Patch(":id/listing")
  async patchListing(@CurrentUser() user: AuthedUser, @Param("id") id: string, @Body() body: ListingPatchDto) {
    const project = assertOwned(await prisma.project.findUnique({ where: { id } }), user.id, "Project");
    return prisma.listingContent.update({ where: { projectId: project.id }, data: body });
  }

  @Post(":id/zip")
  async zip(@CurrentUser() user: AuthedUser, @Param("id") id: string) {
    const project = assertOwned(await prisma.project.findUnique({ where: { id } }), user.id, "Project");
    const job = await prisma.generationJob.create({
      data: {
        userId: user.id,
        projectId: project.id,
        productId: project.productId,
        type: "ZIP_EXPORT",
        payload: {},
        status: "QUEUED",
      },
    });
    try {
      await enqueueGeneration(job.id);
    } catch {
      await processGenerationJob(job.id);
    }
    return { jobId: job.id };
  }
}

@Module({ controllers: [ProjectsController] })
export class ProjectsModule {}
