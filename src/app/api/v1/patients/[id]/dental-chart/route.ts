import { NextResponse } from "next/server";
import { loadDentalChart } from "@/services/dental_chart/loadChart";
import { requirePermission } from "@/lib/api/requirePermission";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const auth = await requirePermission("patients.view");
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const chart = await loadDentalChart(auth.supabase, id);
  if (!chart) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  return NextResponse.json({
    patient: chart.patient,
    teeth: chart.teeth.map((tooth) => ({
      toothNumber: tooth.toothNumber,
      fdi: tooth.fdi,
      arch: tooth.arch,
      activeAlertCount: tooth.activeAlertCount,
      glowing: tooth.glowing,
      conditions: tooth.conditions,
    })),
  });
}
