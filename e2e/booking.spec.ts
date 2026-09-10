import { expect, test } from "@playwright/test";
import { seedE2E, serviceClient } from "./helpers/seed";

/**
 * The public booking path, which is also the atomic RPC every AI booking now
 * goes through. Worth E2E because the failure it guards against — two people
 * taking the same slot — only exists in the database.
 */
test.describe("public booking", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("lists open slots", async ({ request }) => {
    await seedE2E();
    const res = await request.get("/api/v1/booking/slots");
    expect(res.ok()).toBeTruthy();
    const body = (await res.json()) as { slots: { id: string; status: string }[] };
    expect(body.slots.length).toBeGreaterThan(0);
  });

  test("books a slot, and the same slot cannot be booked twice", async ({ request }) => {
    await seedE2E();
    const db = serviceClient();

    // Create a slot for this test alone, at a time nothing else uses, so the
    // assertion never silently skips because earlier runs consumed the seed.
    const startsAt = new Date(Date.now() + 30 * 24 * 60 * 60_000);
    startsAt.setMinutes(0, 0, 0);
    startsAt.setMilliseconds(Math.floor(Math.random() * 1000));
    const { data: slot, error } = await db
      .from("appointment_slots")
      .insert({
        starts_at: startsAt.toISOString(),
        ends_at: new Date(startsAt.getTime() + 60 * 60_000).toISOString(),
        status: "open",
      })
      .select("id,starts_at")
      .single();
    expect(error, "could not create a test slot").toBeNull();

    const payload = {
      slot_id: slot!.id,
      patient_name: "E2E Patient",
      phone: "+201009998877",
      service_label: "Cleaning",
    };

    const first = await request.post("/api/v1/booking", { data: payload });
    expect(first.ok(), await first.text()).toBeTruthy();

    // The slot is now taken; a second attempt must be refused, not silently
    // accepted into a double booking.
    const second = await request.post("/api/v1/booking", { data: payload });
    expect(second.ok()).toBeFalsy();
    expect(second.status()).toBe(409);

    const { data: after } = await db
      .from("appointment_slots")
      .select("status")
      .eq("id", slot!.id)
      .maybeSingle();
    expect(after?.status).toBe("booked");
  });
});
