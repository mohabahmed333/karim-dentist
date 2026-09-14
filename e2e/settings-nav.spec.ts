import { expect, test, type Page } from "@playwright/test";

/**
 * Settings in the sidebar is a container, not a page.
 *
 * It used to link to /admin/settings, which held the dashboard theme — so
 * clicking the group to see what was inside navigated away from wherever you
 * were instead of opening it. The theme now has its own route beside the other
 * settings pages, and the group's label only expands.
 */
/** The labelled sidebar, not the icon rail beside it, which also says "Settings". */
const sidebar = (page: Page) => page.locator("aside").filter({ hasText: "Clinic workspace" });

test.describe("the Settings sidebar group", () => {
  test("opens the group instead of navigating", async ({ page }) => {
    await page.goto("/admin/reservations");

    await sidebar(page).getByRole("button", { name: "Settings", exact: true }).first().click();

    // The whole point: still on the page we started from.
    await expect(page).toHaveURL(/\/admin\/reservations/);
    await expect(
      page.getByRole("link", { name: "Dashboard theme", exact: true }),
    ).toBeVisible();
  });

  test("lists the theme page with its siblings", async ({ page }) => {
    await page.goto("/admin/reservations");
    await sidebar(page).getByRole("button", { name: "Settings", exact: true }).first().click();

    // By href, not by name: "Deposits" is also the reservations-side queue.
    for (const href of ["/admin/settings/theme", "/admin/settings/templates", "/admin/settings/deposits"]) {
      await expect(sidebar(page).locator(`a[href="${href}"]`)).toBeVisible();
    }
  });

  test("the theme page opens from the group", async ({ page }) => {
    await page.goto("/admin/reservations");
    await sidebar(page).getByRole("button", { name: "Settings", exact: true }).first().click();
    await page.getByRole("link", { name: "Dashboard theme", exact: true }).click();

    await expect(page).toHaveURL(/\/admin\/settings\/theme/);
    await expect(page.getByRole("heading", { name: "Dashboard theme" })).toBeVisible();
  });

  test("the old /admin/settings link still lands on the theme page", async ({ page }) => {
    await page.goto("/admin/settings");
    await expect(page).toHaveURL(/\/admin\/settings\/theme/);
  });
});

/** The page that says which templates Meta has, added alongside. */
test.describe("the WhatsApp templates page", () => {
  test("lists every template the clinic needs", async ({ page }) => {
    await page.goto("/admin/settings/templates");

    await expect(page.getByRole("heading", { name: "WhatsApp templates" })).toBeVisible();
    // Registered in the code, so it is listed whatever Meta says about it.
    await expect(page.getByText("reminder_en", { exact: false }).first()).toBeVisible();
    // Never submitted, so the text to submit comes with it.
    await expect(page.getByText("waitlist_offer_en", { exact: false }).first()).toBeVisible();
  });
});
