import { Body, Controller, Get, Put, Module, Post } from "@nestjs/common";
import { IsEnum, IsOptional, IsString, Matches } from "class-validator";
import { BrandStyle, ContentLanguage } from "@prisma/client";
import { CurrentUser } from "../../common/current-user.js";
import type { AuthedUser } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { getStorage, objectKey } from "../../lib/storage.js";

class BrandDto {
  @IsString()
  name!: string;
  @IsString()
  category!: string;
  @IsOptional()
  @IsString()
  website?: string;
  @IsOptional()
  @IsString()
  instagram?: string;
  @IsOptional()
  @IsString()
  whatsapp?: string;
  @IsEnum(BrandStyle)
  style!: BrandStyle;
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/)
  primaryColor!: string;
  @IsString()
  @Matches(/^#([0-9A-Fa-f]{6})$/)
  secondaryColor!: string;
  @IsOptional()
  @IsString()
  defaultCta?: string;
  @IsEnum(ContentLanguage)
  language!: ContentLanguage;
}

@Controller("brands")
export class BrandsController {
  @Get("me")
  me(@CurrentUser() user: AuthedUser) {
    return prisma.brand.findUnique({ where: { userId: user.id } });
  }

  @Put("me")
  async upsert(@CurrentUser() user: AuthedUser, @Body() body: BrandDto) {
    const brand = await prisma.brand.upsert({
      where: { userId: user.id },
      update: body,
      create: { ...body, userId: user.id },
    });
    await prisma.userProfile.update({ where: { id: user.id }, data: { onboardingCompleted: true } });
    return brand;
  }

  @Post("me/logo")
  async logo(@CurrentUser() user: AuthedUser) {
    const key = objectKey(user.id, "brand", "logo.png");
    const signed = await getStorage().presignUpload(key, "image/png");
    const existing = await prisma.brand.findUnique({ where: { userId: user.id } });
    if (existing) await prisma.brand.update({ where: { userId: user.id }, data: { logoKey: key } });
    return { key, ...signed };
  }
}

@Module({ controllers: [BrandsController] })
export class BrandsModule {}
