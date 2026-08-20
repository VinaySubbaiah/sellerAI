import { Controller, Get, Query, Module } from "@nestjs/common";
import { CurrentUser } from "../../common/current-user.js";
import type { AuthedUser } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { DEFAULT_CREDIT_COSTS } from "@sellerstudio/shared";

@Controller("credits")
export class CreditsController {
  @Get("wallet")
  async wallet(@CurrentUser() user: AuthedUser) {
    const wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
    const costs = await prisma.creditCostConfig.findMany();
    const costMap = { ...DEFAULT_CREDIT_COSTS };
    for (const row of costs) costMap[row.key] = row.credits;
    return { balance: wallet?.balance ?? 0, costs: costMap };
  }

  @Get("ledger")
  async ledger(@CurrentUser() user: AuthedUser, @Query("cursor") cursor?: string) {
    const wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
    if (!wallet) return { items: [] };
    const items = await prisma.creditLedger.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    return { items };
  }

  @Get("packages")
  async packages() {
    return prisma.creditPackage.findMany({ where: { active: true }, orderBy: { amountPaise: "asc" } });
  }
}

@Module({ controllers: [CreditsController] })
export class CreditsModule {}
