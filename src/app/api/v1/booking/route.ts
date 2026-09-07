import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { publicBookSchema } from "@/services/clinic_schedule/publicBookSchema";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = publicBookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid booking" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_open_appointment_slot", {
    p_slot_id: parsed.data.slot_id,
    p_patient_name: parsed.data.patient_name,
    p_phone: parsed.data.phone,
    p_email: parsed.data.email || null,
    p_service_id: parsed.data.service_id ?? null,
    p_service_label: parsed.data.service_label,
    p_notes: parsed.data.notes ?? "",
  });

  if (error) {
    const status = error.message.includes("no longer available") ? 409 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ reservation_id: data });
}
