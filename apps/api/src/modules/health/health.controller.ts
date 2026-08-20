import { Controller, Get } from "@nestjs/common";
import { Public } from "../../common/public.decorator.js";
import { prisma } from "../../lib/prisma.js";
import { getRedis } from "../../lib/queue.js";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  async health() {
    let db = "ok";
    let redis = "ok";
    try {
      await prisma.$queryRaw`SELECT 1`;
    } catch {
      db = "error";
    }
    try {
      await getRedis().ping();
    } catch {
      redis = "error";
    }
    return { status: db === "ok" && redis === "ok" ? "ok" : "degraded", db, redis, service: "sellerstudio-api" };
  }
}
