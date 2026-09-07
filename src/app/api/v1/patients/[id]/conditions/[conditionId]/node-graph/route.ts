import { NextResponse } from "next/server";
import { buildNodeGraph } from "@/services/dental_chart";
import { loadDentalChart } from "@/services/dental_chart/loadChart";
import { requireAdmin } from "@/lib/api/requireAdmin";

type Params = { params: Promise<{ id: string; conditionId: string }> };

export async function GET(_request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id, conditionId } = await context.params;
  const chart = await loadDentalChart(auth.supabase, id);
  if (!chart) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  const graph = buildNodeGraph(chart, conditionId);
  if (!graph) {
    return NextResponse.json({ error: "Condition not found" }, { status: 404 });
  }
  return NextResponse.json(graph);
}
