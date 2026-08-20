import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { HttpErrorFilter } from "./common/http-error.filter.js";
import { HealthModule } from "./modules/health/health.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { UsersModule } from "./modules/users/users.module.js";
import { BrandsModule } from "./modules/brands/brands.module.js";
import { ProductsModule } from "./modules/products/products.module.js";
import { UploadsModule } from "./modules/uploads/uploads.module.js";
import { CreditsModule } from "./modules/credits/credits.module.js";
import { PaymentsModule } from "./modules/payments/payments.module.js";
import { GenerationModule } from "./modules/generation/generation.module.js";
import { ProjectsModule } from "./modules/projects/projects.module.js";
import { SupportModule } from "./modules/support/support.module.js";
import { AdminModule } from "./modules/admin/admin.module.js";
import { PublicModule } from "./modules/public/public.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "../../.env"] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
    HealthModule,
    AuthModule,
    UsersModule,
    BrandsModule,
    ProductsModule,
    UploadsModule,
    CreditsModule,
    PaymentsModule,
    GenerationModule,
    ProjectsModule,
    SupportModule,
    AdminModule,
    PublicModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: HttpErrorFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
