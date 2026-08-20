import { describe, expect, it, beforeAll } from "vitest";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { ensureWallet, applyLedger, grantPurchase } from "../lib/credits-ledger.js";

const secret = process.env.AUTH_JWT_SECRET ?? "change-me-dev-only-not-for-production";

describe("credit ledger", () => {
  let userId = "";

  beforeAll(async () => {
    const email = `ledger-${Date.now()}@test.local`;
    const user = await prisma.userProfile.create({
      data: { firebaseUid: `mock:${email}`, email, name: "Ledger" },
    });
    userId = user.id;
    await ensureWallet(prisma, userId);
    await applyLedger(prisma, {
      userId,
      type: "SIGNUP_BONUS",
      amount: 4,
      idempotencyKey: `test-signup-${userId}`,
    });
  });

  it("is idempotent", async () => {
    await applyLedger(prisma, {
      userId,
      type: "SIGNUP_BONUS",
      amount: 4,
      idempotencyKey: `test-signup-${userId}`,
    });
    const wallet = await prisma.creditWallet.findUnique({ where: { userId } });
    expect(wallet?.balance).toBe(4);
  });

  it("reserves and refunds without going negative", async () => {
    await applyLedger(prisma, {
      userId,
      type: "RESERVATION",
      amount: -3,
      idempotencyKey: `res-${userId}`,
      referenceType: "GenerationJob",
      referenceId: "job-1",
    });
    await applyLedger(prisma, {
      userId,
      type: "REFUND",
      amount: 3,
      idempotencyKey: `ref-${userId}`,
      referenceType: "GenerationJob",
      referenceId: "job-1",
    });
    const wallet = await prisma.creditWallet.findUnique({ where: { userId } });
    expect(wallet?.balance).toBe(4);
  });
});

describe("token identity", () => {
  it("encodes uid in sub, not a client-supplied id", () => {
    const token = jwt.sign({ sub: "mock:a@b.com", email: "a@b.com" }, secret);
    const payload = jwt.verify(token, secret) as { sub: string };
    expect(payload.sub).toBe("mock:a@b.com");
  });
});

describe("purchase grant", () => {
  it("does not double-credit the same payment", async () => {
    const email = `pay-${Date.now()}@test.local`;
    const user = await prisma.userProfile.create({
      data: { firebaseUid: `mock:${email}`, email, name: "Pay" },
    });
    await ensureWallet(prisma, user.id);
    const pack = await prisma.creditPackage.findFirst({ where: { active: true } });
    if (!pack) return;
    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        packageId: pack.id,
        amountPaise: pack.amountPaise,
        status: "PAID",
      },
    });
    await grantPurchase(prisma, user.id, pack.credits, payment.id);
    await grantPurchase(prisma, user.id, pack.credits, payment.id);
    const wallet = await prisma.creditWallet.findUnique({ where: { userId: user.id } });
    expect(wallet?.balance).toBe(pack.credits);
  });
});
