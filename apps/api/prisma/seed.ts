import { PrismaClient } from "@prisma/client";
import { CREDIT_PACKAGES, DEFAULT_CREDIT_COSTS } from "@sellerstudio/shared";

const prisma = new PrismaClient();

const faqs = [
  ["Getting Started", "How do I start?", "Create an account, set up your brand kit, then upload a product photo to generate listing content."],
  ["Getting Started", "Do I need a credit card?", "No. New accounts receive 4 free credits. You can buy more later."],
  ["Product Upload", "Which image formats are supported?", "JPEG, PNG and WebP up to 10 MB. Upload 1–5 photos. We strip extra metadata."],
  ["Product Upload", "Will you invent product specifications?", "No. Visual analysis is a suggestion. Confirmed facts are stored separately and you must verify them."],
  ["AI Product Photos", "Does AI change my product?", "Preserve Exact Product Appearance is on by default. We extract the product and composite it onto a new background."],
  ["Marketplace Listing", "What is a listing pack?", "A listing pack generates marketplace images plus title, bullets, description and keywords for 8 credits."],
  ["Marketing", "How is text rendered on creatives?", "Important marketing text is drawn with layout templates so spelling stays under your control."],
  ["Credits", "When are credits charged?", "Credits are reserved when a job starts and consumed only if it succeeds. Full failures are refunded."],
  ["Razorpay Payments", "Is checkout safe?", "Razorpay handles card/UPI data. We verify signatures and never store secret keys in the browser."],
  ["Account", "How do I delete my account?", "Open Settings → Delete Account and type DELETE. Uploaded assets are removed from storage where possible."],
];

async function main() {
  for (const pack of CREDIT_PACKAGES) {
    await prisma.creditPackage.upsert({
      where: { code: pack.code },
      update: { name: pack.name, credits: pack.credits, amountPaise: pack.amountPaise, popular: pack.popular, active: true },
      create: { code: pack.code, name: pack.name, credits: pack.credits, amountPaise: pack.amountPaise, popular: pack.popular },
    });
  }
  for (const [key, credits] of Object.entries(DEFAULT_CREDIT_COSTS)) {
    await prisma.creditCostConfig.upsert({
      where: { key },
      update: { credits },
      create: { key, credits, description: key },
    });
  }
  await prisma.helpArticle.deleteMany();
  await prisma.helpArticle.createMany({
    data: faqs.map(([category, question, answer]) => ({ category, question, answer })),
  });

  const demo = await prisma.userProfile.upsert({
    where: { email: "demo@sellerstudio.ai" },
    update: {},
    create: {
      firebaseUid: "mock:demo@sellerstudio.ai",
      email: "demo@sellerstudio.ai",
      name: "Demo Seller",
      onboardingCompleted: true,
      signupBonusGranted: true,
    },
  });
  await prisma.creditWallet.upsert({
    where: { userId: demo.id },
    update: { balance: 40 },
    create: { userId: demo.id, balance: 40 },
  });
  await prisma.brand.upsert({
    where: { userId: demo.id },
    update: { name: "Northline Home" },
    create: {
      userId: demo.id,
      name: "Northline Home",
      category: "Home & Kitchen",
      style: "PREMIUM",
      primaryColor: "#4F46E5",
      secondaryColor: "#2563EB",
      website: "https://example.com",
      instagram: "@northline",
      defaultCta: "Shop now",
    },
  });
  const existing = await prisma.product.findFirst({ where: { userId: demo.id, name: "Studio Headphones" } });
  if (!existing) {
    await prisma.product.create({
      data: {
        userId: demo.id,
        name: "Studio Headphones",
        brandName: "Northline",
        category: "Electronics",
        sellingPrice: 299900,
        platforms: ["AMAZON", "FLIPKART"],
        description: "Over-ear headphones for everyday listening.",
      },
    });
  }
  const admin = await prisma.userProfile.upsert({
    where: { email: "admin@sellerstudio.ai" },
    update: { role: "ADMIN" },
    create: {
      firebaseUid: "mock:admin@sellerstudio.ai",
      email: "admin@sellerstudio.ai",
      name: "Admin",
      role: "ADMIN",
      onboardingCompleted: true,
      signupBonusGranted: true,
    },
  });
  await prisma.creditWallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, balance: 0 },
  });
  console.log("Seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
