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
const ATTACH_KEY = "e2e-attach";
const PNG_1PX_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAMAASsJTYQAAAAASUVORK5CYII=";

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

  test("sends a reply with an attachment exactly once, and clearing the box drops it", async ({
    page,
    request,
  }) => {
    const { error } = await serviceClient()
      .from("whatsapp_canned_replies")
      .upsert(
        {
          slash_key: ATTACH_KEY,
          title: "E2E attach",
          body: "Price list attached.",
          active: true,
          attachment: null,
          category: "E2E",
          sort_order: 2,
        },
        { onConflict: "slash_key" },
      );
    if (error) throw error;

    // Attach through the real editor: browser upload to the private bucket, then PATCH.
    await page.goto("/admin/quick-replies");
    await page.getByText(`/${ATTACH_KEY}`, { exact: true }).click();
    await page.locator('input[type="file"][accept*="image/png"]').setInputFiles({
      name: "price-list.png",
      mimeType: "image/png",
      buffer: Buffer.from(PNG_1PX_BASE64, "base64"),
    });
    await expect(page.getByText("price-list.png")).toBeVisible();
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Saved", { exact: true })).toBeVisible();

    const { data: saved, error: readError } = await serviceClient()
      .from("whatsapp_canned_replies")
      .select("attachment")
      .eq("slash_key", ATTACH_KEY)
      .single();
    if (readError) throw readError;
    const attachment = saved.attachment as { kind?: string; path?: string } | null;
    expect(attachment?.kind).toBe("image");
    expect(attachment?.path ?? "").not.toBe("");

    const phone = uniquePhone();
    expect((await deliverInbound(request, phone, "hello")).ok()).toBeTruthy();
    const conversation = await conversationByPhone(phone);
    expect(conversation).not.toBeNull();

    const captured: string[] = [];
    await page.route("**/api/v1/whatsapp/send", async (route) => {
      captured.push(route.request().postDataBuffer()?.toString("latin1") ?? "");
      await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    });

    await page.goto("/admin/support");
    await page.locator(`[data-conversation-id="${conversation!.id}"]`).first().click();

    const composer = page.getByLabel("Message", { exact: true });
    const chip = page.getByText("price-list.png");
    await composer.fill(`/${ATTACH_KEY}`);
    await page.getByRole("option", { name: new RegExp(ATTACH_KEY) }).click();
    await expect(composer).toHaveValue("Price list attached.");
    await expect(chip).toBeVisible();

    // The second click lands while the file is still downloading.
    await page.getByRole("button", { name: "Send", exact: true }).dblclick();
    await expect.poll(() => captured.length).toBe(1);
    await page.waitForTimeout(1500);
    expect(captured.length).toBe(1);

    const body = captured[0];
    expect(body).toContain('filename="price-list.png"');
    expect(body).toContain("image/png");
    expect(body).toMatch(/name="text"\s+Price list attached\./);
    await expect(composer).toHaveValue("");
    await expect(chip).toBeHidden();

    // Clearing the message box removes the attachment with it.
    await composer.fill(`/${ATTACH_KEY}`);
    await page.getByRole("option", { name: new RegExp(ATTACH_KEY) }).click();
    await expect(chip).toBeVisible();
    await composer.fill("");
    await expect(chip).toBeHidden();
  });
});
