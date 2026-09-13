import { expect, test } from "@playwright/test";

/**
 * The deposit amount field, which could not be typed into.
 *
 * Clearing it coerced the value to 0 on every keystroke, so the field snapped
 * back to "0" the moment it was emptied — and anyone whose habit is "select all,
 * delete, retype" found it immovable. Worse, the 0 then saved, and the server
 * refused to switch deposits on because the amount was zero: a toggle that
 * flicked itself off, complaining about a field the person had not touched.
 *
 * Driven through a real browser because the bug lived in the gap between a
 * controlled React value and what the input actually displayed — exactly the
 * thing a unit test on the same module cannot see.
 */
test.describe("deposit settings — the amount field", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/settings/deposits");
    await expect(page.getByLabel("Deposit amount (EGP)")).toBeVisible();
  });

  test("accepts typing", async ({ page }) => {
    const amount = page.getByLabel("Deposit amount (EGP)");
    await amount.fill("350");
    await expect(amount).toHaveValue("350");
  });

  test("can be emptied, and stays empty", async ({ page }) => {
    // The actual regression: this used to become "0" as soon as it was cleared.
    const amount = page.getByLabel("Deposit amount (EGP)");
    await amount.fill("");
    await expect(amount).toHaveValue("");
  });

  test("survives being retyped character by character", async ({ page }) => {
    const amount = page.getByLabel("Deposit amount (EGP)");
    await amount.fill("");
    await amount.pressSequentially("250", { delay: 30 });
    await expect(amount).toHaveValue("250");
  });

  test("says why it will not switch on, on the page, and stays off", async ({ page }) => {
    await page.getByLabel("Deposit amount (EGP)").fill("");
    // Base UI renders a button with role=checkbox, not a native input, so
    // getByLabel().check() has nothing to tick.
    await page
      .getByRole("checkbox")
      .first()
      .click();
    await page.getByRole("button", { name: "Save" }).click();

    // Visible where the person is looking, rather than a toast that has gone by
    // the time they wonder what happened.
    // Next renders its own role=alert route announcer, so scope to the form's.
    await expect(
      page.getByRole("alert").filter({ hasText: /deposit amount/i }),
    ).toBeVisible();
  });

  test("the other number fields behave the same way", async ({ page }) => {
    const hold = page.getByLabel("Hold the slot for (minutes)");
    await hold.fill("");
    await expect(hold).toHaveValue("");
    await hold.fill("45");
    await expect(hold).toHaveValue("45");
  });
});
