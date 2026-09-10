import { expect, test } from "@playwright/test";
import { seedE2E } from "./helpers/seed";

test.describe("admin inbox", () => {
  test("loads the front desk for a signed-in admin", async ({ page }) => {
    await seedE2E();
    await page.goto("/admin/support");
    await expect(page).toHaveURL(/\/admin\/support/);
    await expect(page.locator("body")).not.toContainText("Unauthorized");
  });

  test("keeps an admin signed in across admin pages", async ({ page }) => {
    await page.goto("/admin/reservations");
    await expect(page).not.toHaveURL(/\/admin\/login/);
  });
});
