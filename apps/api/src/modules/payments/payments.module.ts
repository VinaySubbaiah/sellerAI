import { Body, Controller, Get, Headers, Post, Req, Module } from "@nestjs/common";
import { SkipThrottle, Throttle } from "@nestjs/throttler";
import type { RawBodyRequest } from "@nestjs/common";
import type { Request } from "express";
import { IsString } from "class-validator";
import { AppError, ErrorCodes } from "@sellerstudio/shared";
import { verifyRazorpayCheckoutSignature, verifyRazorpayWebhookSignature } from "@sellerstudio/shared/razorpay";
import { Public } from "../../common/public.decorator.js";
import { CurrentUser } from "../../common/current-user.js";
import type { AuthedUser } from "../auth/auth.service.js";
import { prisma } from "../../lib/prisma.js";
import { grantPurchase } from "../../lib/credits-ledger.js";
import Razorpay from "razorpay";

class OrderDto {
  @IsString()
  packageId!: string;
}

class VerifyDto {
  @IsString()
  razorpay_order_id!: string;
  @IsString()
  razorpay_payment_id!: string;
  @IsString()
  razorpay_signature!: string;
}

@Controller("payments")
export class PaymentsController {
  @Post("orders")
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async createOrder(@CurrentUser() user: AuthedUser, @Body() body: OrderDto) {
    const pack = await prisma.creditPackage.findFirst({ where: { id: body.packageId, active: true } });
    if (!pack) throw new AppError(ErrorCodes.NOT_FOUND, "Package not found", 404);
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        packageId: pack.id,
        amountPaise: pack.amountPaise,
        currency: pack.currency,
        status: "PENDING",
      },
    });
    const provider = process.env.PAYMENT_PROVIDER ?? "mock";
    if (provider === "mock") {
      const orderId = `order_mock_${payment.id}`;
      await prisma.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: orderId } });
      return {
        provider: "mock",
        keyId: "mock_key",
        orderId,
        amount: pack.amountPaise,
        currency: pack.currency,
        paymentId: payment.id,
        package: pack,
      };
    }
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new AppError(ErrorCodes.CONFIG, "Razorpay is not configured", 500);
    }
    const rz = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    const order = await rz.orders.create({
      amount: pack.amountPaise,
      currency: pack.currency,
      receipt: payment.id,
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { razorpayOrderId: String(order.id) } });
    return {
      provider: "razorpay",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: pack.amountPaise,
      currency: pack.currency,
      paymentId: payment.id,
      package: pack,
    };
  }

  @Post("verify")
  async verify(@CurrentUser() user: AuthedUser, @Body() body: VerifyDto) {
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: body.razorpay_order_id, userId: user.id },
      include: { package: true },
    });
    if (!payment) throw new AppError(ErrorCodes.NOT_FOUND, "Payment not found", 404);
    const provider = process.env.PAYMENT_PROVIDER ?? "mock";
    if (provider === "razorpay") {
      const ok = verifyRazorpayCheckoutSignature({
        orderId: body.razorpay_order_id,
        paymentId: body.razorpay_payment_id,
        signature: body.razorpay_signature,
        secret: process.env.RAZORPAY_KEY_SECRET ?? "",
      });
      if (!ok) throw new AppError(ErrorCodes.PAYMENT_FAILED, "Payment signature invalid", 400);
    }
    await prisma.payment.update({
      where: { id: payment.id },
      data: { razorpayPaymentId: body.razorpay_payment_id, status: "PAID" },
    });
    await grantPurchase(prisma, user.id, payment.package.credits, payment.id);
    const updated = await prisma.payment.findUnique({ where: { id: payment.id } });
    return { payment: updated, credits: payment.package.credits };
  }

  @Public()
  @SkipThrottle()
  @Post("webhook")
  async webhook(@Headers("x-razorpay-signature") signature: string, @Req() req: RawBodyRequest<Request>) {
    const raw = req.rawBody?.toString() ?? JSON.stringify(req.body ?? {});
    const provider = process.env.PAYMENT_PROVIDER ?? "mock";
    if (provider === "razorpay") {
      const ok = verifyRazorpayWebhookSignature({
        rawBody: raw,
        signature: signature ?? "",
        secret: process.env.RAZORPAY_WEBHOOK_SECRET ?? "",
      });
      if (!ok) throw new AppError(ErrorCodes.PAYMENT_FAILED, "Webhook signature invalid", 400);
    }
    const event = JSON.parse(raw) as {
      event?: string;
      payload?: { payment?: { entity?: { id?: string; order_id?: string } } };
    };
    const orderId = event.payload?.payment?.entity?.order_id;
    const paymentId = event.payload?.payment?.entity?.id;
    const providerEventId = `${event.event ?? "mock"}:${paymentId ?? orderId ?? Date.now()}`;
    const existing = await prisma.paymentEvent.findUnique({ where: { providerEventId } });
    if (existing) return { ok: true, duplicate: true };
    if (!orderId) return { ok: true };
    const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: orderId }, include: { package: true } });
    if (!payment) return { ok: true };
    await prisma.paymentEvent.create({
      data: {
        paymentId: payment.id,
        eventType: event.event ?? "payment",
        providerEventId,
        payload: event as object,
        processed: true,
      },
    });
    if (event.event === "payment.captured" || event.event === "payment.authorized" || provider === "mock") {
      await grantPurchase(prisma, payment.userId, payment.package.credits, payment.id);
    }
    return { ok: true };
  }

  @Post("mock/complete")
  async mockComplete(@CurrentUser() user: AuthedUser, @Body() body: { orderId: string }) {
    if ((process.env.PAYMENT_PROVIDER ?? "mock") !== "mock") {
      throw new AppError(ErrorCodes.CONFIG, "Mock payments disabled", 400);
    }
    const payment = await prisma.payment.findFirst({
      where: { razorpayOrderId: body.orderId, userId: user.id },
      include: { package: true },
    });
    if (!payment) throw new AppError(ErrorCodes.NOT_FOUND, "Payment not found", 404);
    const payId = `pay_mock_${payment.id}`;
    await prisma.payment.update({
      where: { id: payment.id },
      data: { razorpayPaymentId: payId, status: "PAID" },
    });
    await grantPurchase(prisma, user.id, payment.package.credits, payment.id);
    return { paymentId: payId, credits: payment.package.credits, amount: payment.amountPaise };
  }

  @Get()
  history(@CurrentUser() user: AuthedUser) {
    return prisma.payment.findMany({
      where: { userId: user.id },
      include: { package: true },
      orderBy: { createdAt: "desc" },
    });
  }
}

@Module({ controllers: [PaymentsController] })
export class PaymentsModule {}
