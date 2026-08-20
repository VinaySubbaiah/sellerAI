import { Body, Controller, Get, Post, Query, Module } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { Public } from "../../common/public.decorator.js";
import { CurrentUser } from "../../common/current-user.js";
import type { AuthedUser } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";

class TicketDto {
  @IsString()
  category!: string;
  @IsString()
  subject!: string;
  @IsString()
  message!: string;
}

@Controller()
export class SupportController {
  @Public()
  @Get("help/faqs")
  faqs(@Query("q") q?: string) {
    return prisma.helpArticle.findMany({
      where: q
        ? {
            OR: [
              { question: { contains: q, mode: "insensitive" } },
              { answer: { contains: q, mode: "insensitive" } },
              { category: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: { category: "asc" },
    });
  }

  @Post("support")
  create(@CurrentUser() user: AuthedUser, @Body() body: TicketDto) {
    return prisma.supportTicket.create({ data: { ...body, userId: user.id } });
  }

  @Get("notifications")
  notifications(@CurrentUser() user: AuthedUser) {
    return prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 30 });
  }

  @Post("notifications/:id/read")
  async read(@CurrentUser() user: AuthedUser, @Query("id") id: string) {
    return prisma.notification.updateMany({ where: { id, userId: user.id }, data: { readAt: new Date() } });
  }
}

@Module({ controllers: [SupportController] })
export class SupportModule {}
