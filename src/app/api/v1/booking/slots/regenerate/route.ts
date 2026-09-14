import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/api/requirePermission";
import { regenerateAllDoctorSlots } from "@/services/doctor_schedule/mutations";

/**
 * Regenerates every bookable doctor's open slots — this used to rebuild the
 * clinic-wide, doctor-less pool, but that pool is retired now that each
 * doctor has their own hours (see the multi-doctor plan). A doctor with no
 * `doctor_hours` row simply produces zero slots; nothing here creates a
 * doctor-less slot anymore.
 */
export async function POST() {
  const auth = await requirePermission("reservations.regenerate-slots");
  if (auth.error) return auth.error;
  const supabase = auth.supabase;

  try {
    const perDoctor = await regenerateAllDoctorSlots(supabase);
    const created = perDoctor.reduce((sum, row) => sum + row.created, 0);

    const from = new Date().toISOString();
    const to = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    const { data: slots, error: slotsError } = await supabase
      .from("appointment_slots")
      .select("id, starts_at, ends_at, status, doctor_id")
      .eq("status", "open")
      .gte("starts_at", from)
      .lte("starts_at", to)
      .order("starts_at", { ascending: true })
      .limit(200);

    if (slotsError) {
      return NextResponse.json({ error: slotsError.message }, { status: 500 });
    }

    return NextResponse.json({
      created,
      perDoctor,
      slots: slots ?? [],
    });
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Regenerate failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
