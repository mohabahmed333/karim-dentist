import { expect, test } from "@playwright/test";
import { serviceClient } from "./helpers/seed";
import { VIEWER_EMAIL } from "./helpers/env";

async function viewerProfileId(): Promise<string> {
  const db = serviceClient();
  const { data, error } = await db.auth.admin.listUsers();
  if (error) throw error;
  const user = data.users.find((u) => u.email === VIEWER_EMAIL);
  if (!user) throw new Error("viewer not seeded — run global setup first");
  return user.id;
}

test.describe("system action log", () => {
  test.beforeEach(async () => {
    const id = await viewerProfileId();
    await serviceClient().from("profiles").update({ deleted_at: null }).eq("id", id);
  });

  test("logs a profiles update, shows the diff, and reverts it", async ({ page }) => {
    const id = await viewerProfileId();

    const deactivate = await page.request.patch(`/api/v1/admin/accounts/${id}`, {
      data: { deleted: true },
    });
    expect(deactivate.ok()).toBe(true);

    await page.goto("/admin/system-log");
    await page.locator("select").first().selectOption("profiles");
    await expect(page.getByText("deleted_at", { exact: false }).first()).toBeVisible();

    // The seed helper's own profile upserts create other legitimate
    // revertible "profiles" entries, so this can't assert zero buttons left
    // — only that reverting the newest one (ours, since the log is
    // newest-first and this PATCH is the most recent profiles write) removes
    // exactly one.
    const revertButtons = page.getByRole("button", { name: "Revert" });
    const before = await revertButtons.count();
    expect(before).toBeGreaterThan(0);

    page.once("dialog", (dialog) => void dialog.accept());
    await revertButtons.first().click();
    await expect(revertButtons).toHaveCount(before - 1, { timeout: 10_000 });

    const { data: reverted } = await serviceClient()
      .from("profiles")
      .select("deleted_at")
      .eq("id", id)
      .single();
    expect(reverted?.deleted_at).toBeNull();
  });

  test("messaging metadata is logged but never shows a revert button", async ({ page }) => {
    await page.goto("/admin/system-log");
    await page.locator("select").first().selectOption("whatsapp_conversations");
    await expect(page.getByRole("button", { name: "Revert" })).toHaveCount(0);
  });

  test("a CMS table never appears in the system log", async ({ page }) => {
    const res = await page.request.get("/api/v1/admin/system-log?table=services");
    const body = await res.json();
    expect(body.rows).toEqual([]);
  });
});
