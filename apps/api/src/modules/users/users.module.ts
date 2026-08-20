import { Body, Controller, Delete, Get, Patch, Module } from "@nestjs/common";
import { IsBoolean, IsOptional, IsString } from "class-validator";
import { CurrentUser } from "../../common/current-user.js";
import type { AuthedUser } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { getStorage } from "../../lib/storage.js";

class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;
  @IsOptional()
  @IsBoolean()
  notificationsEnabled?: boolean;
  @IsOptional()
  @IsBoolean()
  onboardingCompleted?: boolean;
}

@Controller("users")
export class UsersController {
  @Get("me")
  async me(@CurrentUser() user: AuthedUser) {
    const profile = await prisma.userProfile.findUnique({
      where: { id: user.id },
      include: { wallet: true, brand: true },
    });
    return profile;
  }

  @Patch("me")
  async update(@CurrentUser() user: AuthedUser, @Body() body: UpdateUserDto) {
    return prisma.userProfile.update({ where: { id: user.id }, data: body });
  }

  @Delete("me")
  async remove(@CurrentUser() user: AuthedUser, @Body() body: { confirm?: string }) {
    if (body.confirm !== "DELETE") {
      return { error: { code: "VALIDATION", message: "Type DELETE to confirm" } };
    }
    const products = await prisma.product.findMany({ where: { userId: user.id }, include: { images: true } });
    const storage = getStorage();
    for (const p of products) {
      for (const img of p.images) {
        await storage.deleteObject(img.storageKey).catch(() => undefined);
      }
    }
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { deletedAt: new Date(), email: `deleted+${user.id}@invalid.local`, name: "Deleted user" },
    });
    return { ok: true };
  }
}

@Module({ controllers: [UsersController] })
export class UsersModule {}
