import { expect, test } from "@playwright/test";
import { deliverInbound, uniquePhone } from "./helpers/inbound";
import {
  conversationByPhone,
  messagesFor,
  seedE2E,
  serviceClient,
  setAiMode,
} from "./helpers/seed";

const SLASH_KEY = "e2e-visit";

test.describe("quick replies", () => {
  test.beforeEach(async () => {
    await seedE2E();
    // The responder must not reply on its own and change what the thread shows.
    await setAiMode("off");
    const { error } = await serviceClient()
      .from("whatsapp_canned_replies")
      .upsert(
        {
          slash_key: SLASH_KEY,
          title: "E2E visit",
          body: "Hi {{name}}, see you on {{next_appointment}}.",
          category: "E2E",
          active: true,
          attachment: null,
          sort_order: 1,
        },
        { onConflict: "slash_key" },
      );
    if (error) throw error;
  });

  test("lists quick replies on the management page", async ({ page }) => {
    await page.goto("/admin/quick-replies");
    await expect(page.getByText(`/${SLASH_KEY}`)).toBeVisible();
  });

  test("fills known fields and blocks sending until the rest are replaced", async ({ page, request }) => {
    const phone = uniquePhone();
    expect((await deliverInbound(request, phone, "hello")).ok()).toBeTruthy();
    const conversation = await conversationByPhone(phone);
    expect(conversation).not.toBeNull();

    await page.goto("/admin/support");
    await page.locator(`[data-conversation-id="${conversation!.id}"]`).first().click();

    const composer = page.getByLabel("Message", { exact: true });
    await composer.fill(`/${SLASH_KEY}`);
    await page.getByRole("option", { name: new RegExp(SLASH_KEY) }).click();

    // "E2E Patient" is the webhook's contact name; this new number has no reservation.
    await expect(composer).toHaveValue("Hi E2E, see you on {{next_appointment}}.");
    await expect(page.getByRole("status").filter({ hasText: "next appointment" })).toBeVisible();
    const send = page.getByRole("button", { name: "Send", exact: true });
    await expect(send).toBeDisabled();
    await composer.press("Enter");
    expect((await messagesFor(conversation!.id)).some((m) => m.direction === "outbound")).toBe(false);

    await composer.fill("Hi E2E, see you on Tuesday.");
    await expect(send).toBeEnabled();
    await send.click();

    await expect
      .poll(
        async () =>
          (await messagesFor(conversation!.id)).some(
            (m) => m.direction === "outbound" && m.body === "Hi E2E, see you on Tuesday.",
          ),
        { timeout: 15_000 },
      )
      .toBe(true);
  });
});
