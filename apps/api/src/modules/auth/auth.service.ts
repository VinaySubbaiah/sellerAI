import { Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/prisma.js";
import { ensureWallet, grantSignupBonus } from "../../lib/credits-ledger.js";
import { SIGNUP_BONUS_CREDITS } from "@sellerstudio/shared";

export type AuthedUser = {
  id: string;
  firebaseUid: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  onboardingCompleted: boolean;
};

@Injectable()
export class AuthService {
  async verifyAndLoadUser(token: string, fingerprint?: string | string[]): Promise<AuthedUser> {
    const identity = await this.verifyToken(token);
    let user = await prisma.userProfile.findUnique({ where: { firebaseUid: identity.uid } });
    if (!user) {
      user = await prisma.userProfile.create({
        data: {
          firebaseUid: identity.uid,
          email: identity.email,
          name: identity.name || identity.email.split("@")[0] || "Seller",
        },
      });
      await ensureWallet(prisma, user.id);
      await grantSignupBonus(
        prisma,
        user.id,
        Number(process.env.SIGNUP_BONUS_CREDITS ?? SIGNUP_BONUS_CREDITS),
        Array.isArray(fingerprint) ? fingerprint[0] : fingerprint,
      );
    } else if (!user.signupBonusGranted) {
      await ensureWallet(prisma, user.id);
      await grantSignupBonus(
        prisma,
        user.id,
        Number(process.env.SIGNUP_BONUS_CREDITS ?? SIGNUP_BONUS_CREDITS),
        Array.isArray(fingerprint) ? fingerprint[0] : fingerprint,
      );
    } else {
      await ensureWallet(prisma, user.id);
    }
    if (user.deletedAt) throw new UnauthorizedException("Account deleted");
    return {
      id: user.id,
      firebaseUid: user.firebaseUid,
      email: user.email,
      name: user.name,
      role: user.role,
      onboardingCompleted: user.onboardingCompleted,
    };
  }

  async verifyToken(token: string): Promise<{ uid: string; email: string; name: string }> {
    const provider = process.env.AUTH_PROVIDER ?? "mock";
    if (provider === "mock") {
      try {
        const payload = jwt.verify(token, process.env.AUTH_JWT_SECRET ?? "change-me-dev-only-not-for-production") as {
          sub: string;
          email: string;
          name?: string;
        };
        return { uid: payload.sub, email: payload.email, name: payload.name ?? "" };
      } catch {
        throw new UnauthorizedException("Expired or invalid login");
      }
    }
    const admin = await getFirebase();
    try {
      const decoded = await admin.auth().verifyIdToken(token);
      if (!decoded.email) throw new UnauthorizedException("Email required");
      return { uid: decoded.uid, email: decoded.email, name: decoded.name ?? "" };
    } catch {
      throw new UnauthorizedException("Expired or invalid login");
    }
  }

  mockSignup(email: string, password: string, name: string) {
    if (password.length < 8) throw new UnauthorizedException("Password must be at least 8 characters");
    const uid = `mock:${email.toLowerCase()}`;
    const token = jwt.sign(
      { sub: uid, email: email.toLowerCase(), name },
      process.env.AUTH_JWT_SECRET ?? "change-me-dev-only-not-for-production",
      { expiresIn: "7d" },
    );
    return { token, provider: "mock" };
  }

  mockLogin(email: string, _password: string, name?: string) {
    const uid = `mock:${email.toLowerCase()}`;
    const token = jwt.sign(
      { sub: uid, email: email.toLowerCase(), name: name ?? email.split("@")[0] },
      process.env.AUTH_JWT_SECRET ?? "change-me-dev-only-not-for-production",
      { expiresIn: "7d" },
    );
    return { token, provider: "mock" };
  }
}

let firebaseApp: typeof import("firebase-admin") | undefined;
async function getFirebase() {
  if (!firebaseApp) {
    const admin = await import("firebase-admin");
    if (!admin.apps.length) {
      const key = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !key) {
        throw new UnauthorizedException("Firebase is not configured");
      }
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: key,
        }),
      });
    }
    firebaseApp = admin;
  }
  return firebaseApp;
}
