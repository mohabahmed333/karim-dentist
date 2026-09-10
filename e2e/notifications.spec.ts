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

/**
 * The reservations trigger.
 *
 * Entirely a database behaviour, and the reason it is a trigger rather than
 * application code is precisely that it must fire for writes the application
 * makes directly — so a fake would test the wrong thing.
 */
test.describe("reservations -> outbox trigger", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const PHONE = "+201007770000";

  async function makeReservation(hoursAhead: number) {
    const db = serviceClient();
    const { data, error } = await db
      .from("reservations")
      .insert({
        patient_name: "E2E Patient",
        phone: PHONE,
        service_label: "Cleaning",
        starts_at: new Date(Date.now() + hoursAhead * 3_600_000).toISOString(),
      })
      .select("id")
      .single();
    expect(error).toBeNull();
    return { db, id: data!.id as string };
  }

  async function notificationsFor(
    db: ReturnType<typeof serviceClient>,
    reservationId: string,
  ) {
    const { data } = await db
      .from("patient_notifications")
      .select("kind, status, scheduled_for, starts_at")
      .eq("reservation_id", reservationId)
      .order("kind");
    return data ?? [];
  }

  test("a future booking is confirmed now and arms a reminder one lead ahead", async () => {
    await seedE2E();
    const { db, id } = await makeReservation(24 * 10);
    const rows = await notificationsFor(db, id);

    expect(rows.map((r) => r.kind)).toEqual(["confirmation", "reminder_24h"]);
    expect(rows.every((r) => r.status === "pending")).toBe(true);

    // The reminder must sit exactly reminder_lead_minutes before the
    // appointment — 24h by default. Anything else makes the approved template's
    // word "tomorrow" a lie.
    const reminder = rows.find((r) => r.kind === "reminder_24h")!;
    const gapMs =
      Date.parse(reminder.starts_at!) - Date.parse(reminder.scheduled_for);
    expect(gapMs).toBe(24 * 3_600_000);

    await db.from("reservations").delete().eq("id", id);
  });

  test("a booking inside the lead time gets a confirmation and no stale reminder", async () => {
    await seedE2E();
    // Five hours out: a 24h reminder would be scheduled in the past and fire
    // immediately, seconds after the confirmation that already gave the time.
    const { db, id } = await makeReservation(5);
    const rows = await notificationsFor(db, id);

    expect(rows.map((r) => r.kind)).toEqual(["confirmation"]);
    await db.from("reservations").delete().eq("id", id);
  });

  test("rescheduling withdraws the old reminder and arms a new one", async () => {
    await seedE2E();
    const { db, id } = await makeReservation(24 * 10);
    await db
      .from("reservations")
      .update({ starts_at: new Date(Date.now() + 24 * 20 * 3_600_000).toISOString() })
      .eq("id", id);

    const rows = await notificationsFor(db, id);
    const live = rows.filter((r) => r.status === "pending").map((r) => r.kind).sort();
    // The patient is told once about the move, and exactly one reminder is live.
    expect(live).toEqual(["reminder_24h", "reschedule"]);
    expect(rows.filter((r) => r.status === "superseded").length).toBeGreaterThan(0);

    await db.from("reservations").delete().eq("id", id);
  });

  test("cancelling withdraws everything pending and says so once", async () => {
    await seedE2E();
    const { db, id } = await makeReservation(24 * 10);
    await db.from("reservations").update({ status: "cancelled" }).eq("id", id);

    const rows = await notificationsFor(db, id);
    const live = rows.filter((r) => r.status === "pending").map((r) => r.kind);
    expect(live).toEqual(["cancellation"]);
    // Critically, the armed reminder must not survive a cancellation.
    expect(
      rows.filter((r) => r.kind === "reminder_24h" && r.status === "pending"),
    ).toHaveLength(0);

    await db.from("reservations").delete().eq("id", id);
  });

  test("soft-deleting withdraws pending work but tells the patient nothing", async () => {
    await seedE2E();
    const { db, id } = await makeReservation(24 * 10);
    await db
      .from("reservations")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);

    const rows = await notificationsFor(db, id);
    // Deleting is how staff tidy a row away; cancelling is how they tell a
    // patient. Conflating them messages people about records maintenance.
    expect(rows.filter((r) => r.status === "pending")).toHaveLength(0);
    expect(rows.filter((r) => r.kind === "cancellation")).toHaveLength(0);

    await db.from("reservations").delete().eq("id", id);
  });
});

/**
 * The dispatch endpoint's front door.
 *
 * It sends WhatsApp messages to patients, so the interesting cases are the ones
 * where it must refuse.
 */
test.describe("dispatch endpoint auth", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("refuses an anonymous caller", async ({ request }) => {
    const res = await request.get("/api/v1/notifications/dispatch");
    // 503 when CRON_SECRET is unset, 401 when it is set and not supplied.
    // Never 200 — an unset secret must lock the endpoint, not open it.
    expect([401, 503]).toContain(res.status());
  });

  test("refuses a wrong secret", async ({ request }) => {
    const res = await request.get("/api/v1/notifications/dispatch", {
      headers: { Authorization: "Bearer not-the-secret" },
    });
    expect([401, 503]).toContain(res.status());
    expect(res.status()).not.toBe(200);
  });

  test("accepts pg_net's POST with the right secret", async ({ request }) => {
    const secret = process.env.CRON_SECRET ?? "";
    test.skip(!secret, "needs CRON_SECRET");
    const res = await request.post("/api/v1/notifications/dispatch", {
      headers: { Authorization: `Bearer ${secret}` },
      data: { source: "pg_cron" },
    });
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { claimed: number; outcomes: unknown[] };
    expect(typeof body.claimed).toBe("number");
  });
});
