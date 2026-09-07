import { NextResponse } from "next/server";
import { encounterCreateSchema } from "@/services/dental_chart";
import { loadDentalChart } from "@/services/dental_chart/loadChart";
import { requireAdmin } from "@/lib/api/requireAdmin";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const parsed = encounterCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const chart = await loadDentalChart(auth.supabase, id);
  if (!chart) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  const phone = chart.patient.id.startsWith("phone:")
    ? chart.patient.id.slice("phone:".length)
    : "";
  const { data, error } = await auth.supabase
    .from("reservations")
    .insert({
      patient_name: chart.patient.name,
      phone,
      service_label: parsed.data.type,
      starts_at: parsed.data.timestamp,
      notes: parsed.data.notes ?? "",
      status: "completed",
    })
    .select()
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ encounter: data }, { status: 201 });
}
