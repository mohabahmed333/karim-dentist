import { NextResponse } from "next/server";
import { loadDentalChart } from "@/services/dental_chart/loadChart";
import { requireAdmin } from "@/lib/api/requireAdmin";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Params) {
  const auth = await requireAdmin();
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
