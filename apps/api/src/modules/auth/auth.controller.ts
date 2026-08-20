import { Body, Controller, Get, Inject, Post } from "@nestjs/common";
import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";
import { Throttle } from "@nestjs/throttler";
import { Public } from "../../common/public.decorator.js";
import { CurrentUser } from "../../common/current-user.js";
import { AuthService, type AuthedUser } from "./auth.service.js";

class MockAuthDto {
  @IsEmail()
  email!: string;
  @IsString()
  @MinLength(8)
  password!: string;
  @IsOptional()
  @IsString()
  name?: string;
}

class SignupDto extends MockAuthDto {
  @IsBoolean()
  acceptedTerms!: boolean;
}

@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Public()
  @Get("config")
  config() {
    return { provider: process.env.AUTH_PROVIDER ?? "mock" };
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post("mock/signup")
  mockSignup(@Body() body: SignupDto) {
    if (process.env.AUTH_PROVIDER !== "mock") {
      return { error: { code: "CONFIG", message: "Mock auth is disabled" } };
    }
    if (!body.acceptedTerms) {
      return { error: { code: "VALIDATION", message: "Please accept the terms" } };
    }
    return this.auth.mockSignup(body.email, body.password, body.name || body.email.split("@")[0]!);
  }

  @Public()
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post("mock/login")
  mockLogin(@Body() body: MockAuthDto) {
    if (process.env.AUTH_PROVIDER !== "mock") {
      return { error: { code: "CONFIG", message: "Mock auth is disabled" } };
    }
    return this.auth.mockLogin(body.email, body.password, body.name);
  }

  @Get("me")
  me(@CurrentUser() user: AuthedUser) {
    return user;
  }
}
