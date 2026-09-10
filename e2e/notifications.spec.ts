import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, VIEWER_EMAIL, VIEWER_PASSWORD } from "./helpers/env";
import { seedE2E, serviceClient } from "./helpers/seed";
import { phoneSuffixForLookup } from "../src/services/reservations/phoneSuffix";

const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * The notification outbox's storage guarantees.
 *
 * E2E rather than unit, because every property asserted here — the generated
 * column, the unique index, RLS — exists only in the database. A fake would
 * assert that the fake works.
 */
test.describe("patient_notifications storage", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("ships disabled: the settings singleton exists and is off", async () => {
    await seedE2E();
    const db = serviceClient();
    const { data, error } = await db
      .from("patient_notification_settings")
      .select("id, mode, timezone, reminder_lead_minutes");

    expect(error).toBeNull();
    expect(data, "exactly one settings row, seeded by the migration").toHaveLength(1);
    // Outbound messaging to patients must never turn itself on by deploying.
    expect(data?.[0].mode).toBe("off");
    expect(data?.[0].timezone).toBe("Africa/Cairo");
    expect(data?.[0].reminder_lead_minutes).toBe(1440);
  });

  test("dedupe_key blocks a duplicate even after the first is superseded", async () => {
    await seedE2E();
    const db = serviceClient();
    const key = `e2e-dupe-${Date.now()}`;

    const first = await db
      .from("patient_notifications")
      .insert({ dedupe_key: key, kind: "confirmation", phone: "+201005551234" });
    expect(first.error).toBeNull();

    // Supersede it, the way a cancellation would.
    await db
      .from("patient_notifications")
      .update({ status: "superseded" })
      .eq("dedupe_key", key);

    // The index is deliberately full rather than partial: without this, a
    // repeated UPDATE on the reservation would re-send what staff cancelled.
    const second = await db
      .from("patient_notifications")
      .insert({ dedupe_key: key, kind: "confirmation", phone: "+201005551234" });
    expect(second.error, "a superseded row must still block a duplicate").not.toBeNull();
    expect(second.error?.code).toBe("23505");

    await db.from("patient_notifications").delete().eq("dedupe_key", key);
  });

  test("phone_suffix matches phoneSuffixForLookup for every shape a number is written in", async () => {
    await seedE2E();
    const db = serviceClient();
    const stamp = Date.now();
    // The same Egyptian mobile, as patients and forms actually write it.
    const shapes = ["+20 100 555 1234", "0100-555-1234", "00201005551234"];

    const rows = shapes.map((phone, i) => ({
      dedupe_key: `e2e-suffix-${stamp}-${i}`,
      kind: "confirmation" as const,
      phone,
    }));
    const { error } = await db.from("patient_notifications").insert(rows);
    expect(error).toBeNull();

    const { data } = await db
      .from("patient_notifications")
      .select("phone, phone_suffix")
      .like("dedupe_key", `e2e-suffix-${stamp}-%`);

    // If SQL and JS ever disagree here, opt-outs silently stop matching and a
    // patient who asked to be left alone keeps getting messages.
    for (const row of data ?? []) {
      expect(row.phone_suffix).toBe(phoneSuffixForLookup(row.phone));
    }
    expect(new Set((data ?? []).map((r) => r.phone_suffix)).size).toBe(1);

    await db
      .from("patient_notifications")
      .delete()
      .like("dedupe_key", `e2e-suffix-${stamp}-%`);
  });

  test("a signed-in non-admin cannot read the outbox", async () => {
    test.skip(!ANON_KEY, "needs NEXT_PUBLIC_SUPABASE_ANON_KEY");
    await seedE2E();
    const db = serviceClient();
    const key = `e2e-rls-${Date.now()}`;
    await db
      .from("patient_notifications")
      .insert({ dedupe_key: key, kind: "confirmation", phone: "+201005551234" });

    const supabase = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
    });
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: VIEWER_EMAIL,
      password: VIEWER_PASSWORD,
    });
    expect(signInError).toBeNull();

    // Patient phone numbers and appointment times are exactly what RLS is for.
    const { data } = await supabase.from("patient_notifications").select("id");
    expect(data ?? [], "a viewer must see nothing in the outbox").toHaveLength(0);

    await db.from("patient_notifications").delete().eq("dedupe_key", key);
  });
});
