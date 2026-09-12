import { expect, test } from "@playwright/test";
import { conversationByPhone, seedE2E, setAiMode } from "./helpers/seed";
import { uniquePhone } from "./helpers/inbound";
import { inboundButtonReplyEvent, signWebhookBody } from "./helpers/signWebhook";

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

  test("shows a tapped reply button as a distinct chip, not plain text", async ({ page, request }) => {
    await seedE2E();
    // The responder must not reply on its own and change what the thread shows.
    await setAiMode("off");

    const phone = uniquePhone();
    const body = JSON.stringify(
      inboundButtonReplyEvent({ phone, buttonId: "qr_visit_1", title: "Confirm" }),
    );
    const res = await request.post("/api/v1/whatsapp/webhook", {
      headers: {
        "content-type": "application/json",
        "x-webhook-event": "whatsapp.message.received",
        "x-webhook-signature": signWebhookBody(body),
        "x-idempotency-key": `e2e-${Date.now()}-${Math.random()}`,
      },
      data: body,
    });
    expect(res.ok()).toBeTruthy();

    const conversation = await conversationByPhone(phone);
    expect(conversation).not.toBeNull();

    await page.goto("/admin/support");
    await page.locator(`[data-conversation-id="${conversation!.id}"]`).first().click();

    const chip = page.getByRole("status").filter({ hasText: "Confirm" });
    await expect(chip).toBeVisible();

    // The plain-text paragraph is suppressed for a tap: within the message
    // thread, "Confirm" appears exactly once (inside the chip), not also as
    // an ordinary text bubble. Scoped to [data-message-id] so unrelated
    // "Confirm" text elsewhere on the admin page (e.g. an AI action chip)
    // can't make this assertion fragile.
    await expect(page.locator("[data-message-id]").getByText("Confirm", { exact: true })).toHaveCount(1);
  });
});
