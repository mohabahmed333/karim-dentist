import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { regenerateOpenSlotsWithClient } from "@/services/clinic_schedule/regenerate";
import type { ClinicHours } from "@/services/clinic_schedule/types";

const HOURS_ID = "00000000-0000-4000-8000-000000000001";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: hours, error: hoursError } = await supabase
    .from("clinic_hours")
    .select("*")
    .eq("id", HOURS_ID)
    .maybeSingle();

  if (hoursError) {
    return NextResponse.json({ error: hoursError.message }, { status: 500 });
  }
  if (!hours) {
    return NextResponse.json(
      { error: "Clinic hours not configured" },
      { status: 404 },
    );
  }

  try {
    const created = await regenerateOpenSlotsWithClient(
      supabase,
      hours as ClinicHours,
    );
    const from = new Date().toISOString();
    const to = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    const { data: slots, error: slotsError } = await supabase
      .from("appointment_slots")
      .select("id, starts_at, ends_at, status")
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
