import { test, expect } from "@playwright/test";

test("public landing loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Upload Once. Sell Everywhere." })).toBeVisible();
  await expect(page.getByText("No credit card required")).toBeVisible();
});

test("pricing loads", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { name: /Simple credits/ })).toBeVisible();
  await expect(page.getByText("Most Popular")).toBeVisible();
});

test("signup, onboarding, product, credits", async ({ page }) => {
  const email = `e2e.${Date.now()}@sellerstudio.test`;
  await page.goto("/signup");
  await page.getByLabel("Name").fill("E2E Seller");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password12");
  await page.locator('input[type="checkbox"]').check();
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL(/onboarding|app/);
  await expect(page.locator("body")).toContainText(/Brand setup|Create. Optimize|credits/i);
  if (await page.getByText("Skip for now").isVisible()) {
    await page.getByText("Skip for now").click();
  }
  await page.goto("/app/products/new");
  await page.getByLabel("Product Name").fill("Demo Mug");
  await page.getByLabel("Category").fill("Kitchen");
  await page.getByRole("button", { name: "Create Product" }).click();
  await page.waitForURL(/upload/);
  await expect(page.getByRole("heading", { name: /Upload product photos/ })).toBeVisible();
  await page.goto("/app/billing");
  await expect(page.getByRole("heading", { name: "Credits & Billing" })).toBeVisible();
  await expect(page.locator("body")).toContainText("4");
});
