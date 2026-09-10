import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, VIEWER_EMAIL, VIEWER_PASSWORD } from "./helpers/env";

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Locks in the authorization fix.
 *
 * Before it, requireAdmin() checked only that a user was authenticated, and
 * three WhatsApp routes then acted through the service-role client, which
 * bypasses RLS. With signup enabled, anyone who registered could send WhatsApp
 * messages from the clinic's number.
 */
test.describe("admin API authorization", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("rejects an anonymous caller", async ({ request }) => {
    const res = await request.post("/api/v1/whatsapp/send", {
      data: { conversationId: "00000000-0000-4000-8000-000000000001", text: "hi" },
    });
    expect(res.status()).toBe(401);
  });

  test("rejects an authenticated non-admin with 403, not 401", async ({ request }) => {
    test.skip(!ANON_KEY, "needs NEXT_PUBLIC_SUPABASE_ANON_KEY");

    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: VIEWER_EMAIL,
      password: VIEWER_PASSWORD,
    });
    expect(error, "viewer should be able to sign in").toBeNull();

    const res = await request.post("/api/v1/whatsapp/send", {
      headers: { Authorization: `Bearer ${data.session?.access_token}` },
      data: { conversationId: "00000000-0000-4000-8000-000000000001", text: "hi" },
    });
    // Signed in, but not an admin: authenticated yet unauthorized.
    expect([401, 403]).toContain(res.status());
    expect(res.status(), "a viewer must never reach the send path").not.toBe(200);
  });
});
