import type { LedgerType, Prisma, PrismaClient } from "@prisma/client";
import { AppError, ErrorCodes, applyLedgerDelta } from "@sellerstudio/shared";

export async function ensureWallet(db: PrismaClient, userId: string) {
  return db.creditWallet.upsert({
    where: { userId },
    update: {},
    create: { userId, balance: 0 },
  });
}

export async function applyLedger(
  db: PrismaClient | Prisma.TransactionClient,
  input: {
    userId: string;
    type: LedgerType;
    amount: number;
    idempotencyKey: string;
    referenceType?: string;
    referenceId?: string;
    metadata?: Prisma.InputJsonValue;
  },
) {
  const existing = await db.creditLedger.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
  if (existing) return existing;

  const wallet = await db.creditWallet.findUnique({ where: { userId: input.userId } });
  if (!wallet) throw new AppError(ErrorCodes.NOT_FOUND, "Wallet not found", 404);

  const next = applyLedgerDelta(wallet.balance, input.amount);
  const updated = await db.creditWallet.update({
    where: { id: wallet.id, version: wallet.version },
    data: { balance: next, version: { increment: 1 } },
  });

  return db.creditLedger.create({
    data: {
      walletId: updated.id,
      type: input.type,
      amount: input.amount,
      balanceAfter: next,
      referenceType: input.referenceType,
      referenceId: input.referenceId,
      idempotencyKey: input.idempotencyKey,
      metadata: input.metadata,
    },
  });
}

export async function reserveCredits(
  db: PrismaClient,
  userId: string,
  amount: number,
  jobId: string,
) {
  if (amount === 0) return;
  await db.$transaction(async (tx) => {
    await applyLedger(tx, {
      userId,
      type: "RESERVATION",
      amount: -amount,
      idempotencyKey: `reserve:${jobId}`,
      referenceType: "GenerationJob",
      referenceId: jobId,
    });
  });
}

export async function consumeReservation(
  db: PrismaClient,
  userId: string,
  amount: number,
  jobId: string,
) {
  if (amount === 0) return;
  await db.$transaction(async (tx) => {
    await applyLedger(tx, {
      userId,
      type: "CONSUMPTION",
      amount: 0,
      idempotencyKey: `consume:${jobId}`,
      referenceType: "GenerationJob",
      referenceId: jobId,
      metadata: { reserved: amount },
    });
  });
}

export async function refundReservation(
  db: PrismaClient,
  userId: string,
  amount: number,
  jobId: string,
) {
  if (amount === 0) return;
  await db.$transaction(async (tx) => {
    await applyLedger(tx, {
      userId,
      type: "REFUND",
      amount,
      idempotencyKey: `refund:${jobId}`,
      referenceType: "GenerationJob",
      referenceId: jobId,
    });
  });
}

export async function grantSignupBonus(db: PrismaClient, userId: string, credits: number, fingerprint?: string) {
  await db.$transaction(async (tx) => {
    const user = await tx.userProfile.findUnique({ where: { id: userId } });
    if (!user || user.signupBonusGranted) return;
    if (fingerprint) {
      const dup = await tx.userProfile.findFirst({
        where: { signupFingerprint: fingerprint, signupBonusGranted: true, id: { not: userId } },
      });
      if (dup) {
        await tx.userProfile.update({ where: { id: userId }, data: { signupBonusGranted: true } });
        return;
      }
    }
    await applyLedger(tx, {
      userId,
      type: "SIGNUP_BONUS",
      amount: credits,
      idempotencyKey: `signup:${userId}`,
      referenceType: "UserProfile",
      referenceId: userId,
    });
    await tx.userProfile.update({ where: { id: userId }, data: { signupBonusGranted: true, signupFingerprint: fingerprint } });
  });
}

export async function grantPurchase(
  db: PrismaClient,
  userId: string,
  credits: number,
  paymentId: string,
) {
  await db.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new AppError(ErrorCodes.NOT_FOUND, "Payment not found", 404);
    if (payment.creditsGranted) return payment;
    await applyLedger(tx, {
      userId,
      type: "PURCHASE",
      amount: credits,
      idempotencyKey: `purchase:${paymentId}`,
      referenceType: "Payment",
      referenceId: paymentId,
    });
    return tx.payment.update({
      where: { id: paymentId },
      data: { creditsGranted: true, status: "PAID", confirmedAt: new Date() },
    });
  });
}
