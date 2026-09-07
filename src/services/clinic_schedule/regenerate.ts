import type { SupabaseClient } from "@supabase/supabase-js";
import { expandClinicSlots } from "./expandSlots";
import type { ClinicHours } from "./types";

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object" && "message" in err) {
    const msg = (err as { message?: unknown }).message;
    if (typeof msg === "string" && msg.trim()) return msg;
  }
  return "Regenerate failed";
}

/** Rebuild upcoming open slots from hours; keep booked rows. */
export async function regenerateOpenSlotsWithClient(
  supabase: SupabaseClient,
  hours: ClinicHours,
): Promise<number> {
  const now = new Date();
  const expanded = expandClinicSlots({
    openWeekdays: hours.open_weekdays,
    timeWindows: hours.time_windows,
    slotMinutes: hours.slot_minutes,
    horizonDays: hours.horizon_days,
    from: now,
  });

  const { error: cancelError } = await supabase
    .from("appointment_slots")
    .update({ status: "cancelled", updated_at: now.toISOString() })
    .eq("status", "open")
    .gte("starts_at", now.toISOString());
  if (cancelError) throw new Error(errorMessage(cancelError));

  const { data: booked, error: bookedError } = await supabase
    .from("appointment_slots")
    .select("starts_at")
    .eq("status", "booked")
    .gte("starts_at", now.toISOString());
  if (bookedError) throw new Error(errorMessage(bookedError));

  const bookedStarts = new Set((booked ?? []).map((r) => r.starts_at));

  // Overlapping windows (e.g. 10:00-13:00 + 10:00-12:00) create duplicate starts —
  // unique index requires one row per starts_at for non-cancelled statuses.
  const byStart = new Map<string, { starts_at: string; ends_at: string; status: "open" }>();
  for (const slot of expanded) {
    const starts_at = slot.startsAt.toISOString();
    if (bookedStarts.has(starts_at)) continue;
    if (byStart.has(starts_at)) continue;
    byStart.set(starts_at, {
      starts_at,
      ends_at: slot.endsAt.toISOString(),
      status: "open",
    });
  }
  const rows = [...byStart.values()].sort((a, b) =>
    a.starts_at.localeCompare(b.starts_at),
  );

  if (rows.length === 0) return 0;

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: insertError } = await supabase
      .from("appointment_slots")
      .insert(chunk);
    if (insertError) throw new Error(errorMessage(insertError));
  }
  return rows.length;
}
