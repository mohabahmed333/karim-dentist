import { test as setup, expect } from "@playwright/test";
import { seedE2E } from "./helpers/seed";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "./helpers/env";

const ADMIN_STATE = "e2e/.auth/admin.json";

/**
 * Seed the database and sign in once. Every other spec reuses the saved
 * storage state, so no test pays the login cost.
 */
setup("seed and authenticate", async ({ page }) => {
  await seedE2E();

  await page.goto("/admin/login");
  await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
  await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
  await page.getByRole("button", { name: /sign in|log in/i }).click();

  await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 30_000 });
  await page.context().storageState({ path: ADMIN_STATE });
});
