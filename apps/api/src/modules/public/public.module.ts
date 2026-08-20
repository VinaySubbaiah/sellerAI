import { Controller, Get, Module } from "@nestjs/common";
import { Public } from "../../common/public.decorator.js";
import { prisma } from "../../lib/prisma.js";
import { CREDIT_PACKAGES, DEFAULT_CREDIT_COSTS, FREE_PLAN } from "@sellerstudio/shared";

@Controller("public")
export class PublicController {
  @Public()
  @Get("pricing")
  async pricing() {
    const dbPackages = await prisma.creditPackage.findMany({ where: { active: true } });
    const costs = await prisma.creditCostConfig.findMany();
    return {
      free: FREE_PLAN,
      packages: dbPackages.length ? dbPackages : CREDIT_PACKAGES,
      costs: Object.fromEntries(costs.map((c) => [c.key, c.credits])),
      fallbackCosts: DEFAULT_CREDIT_COSTS,
    };
  }
}

@Module({ controllers: [PublicController] })
export class PublicModule {}
