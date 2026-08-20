import { Body, Controller, Get, Post, UseGuards, Module } from "@nestjs/common";
import { IsInt, IsString } from "class-validator";
import { AdminGuard } from "../../common/admin.guard.js";
import { prisma } from "../../lib/prisma.js";
import { applyLedger } from "../../lib/credits-ledger.js";

@Controller("admin")
@UseGuards(AdminGuard)
export class AdminController {
  @Get("overview")
  async overview() {
    const [users, products, jobs, failed, payments, tickets] = await Promise.all([
      prisma.userProfile.count(),
      prisma.product.count(),
      prisma.generationJob.count(),
      prisma.generationJob.count({ where: { status: "FAILED" } }),
      prisma.payment.count(),
      prisma.supportTicket.count(),
    ]);
    return { users, products, jobs, failed, payments, tickets };
  }

  @Get("users")
  users() {
    return prisma.userProfile.findMany({ include: { wallet: true }, take: 100, orderBy: { createdAt: "desc" } });
  }

  @Get("jobs")
  jobs() {
    return prisma.generationJob.findMany({ take: 100, orderBy: { createdAt: "desc" } });
  }

  @Get("payments")
  payments() {
    return prisma.payment.findMany({ take: 100, include: { package: true }, orderBy: { createdAt: "desc" } });
  }

  @Get("ledger")
  ledger() {
    return prisma.creditLedger.findMany({ take: 100, orderBy: { createdAt: "desc" } });
  }

  @Get("tickets")
  tickets() {
    return prisma.supportTicket.findMany({ take: 100, orderBy: { createdAt: "desc" } });
  }

  @Post("credits/adjust")
  async adjust(@Body() body: { userId: string; amount: number; reason: string }) {
    if (!body.reason) return { error: "Reason required" };
    return applyLedger(prisma, {
      userId: body.userId,
      type: "ADMIN_ADJUSTMENT",
      amount: body.amount,
      idempotencyKey: `admin:${body.userId}:${Date.now()}`,
      metadata: { reason: body.reason },
    });
  }
}

@Module({ controllers: [AdminController] })
export class AdminModule {}
