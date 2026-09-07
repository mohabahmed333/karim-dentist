import { NextResponse } from "next/server";
import {
  clusterTimelineTicks,
  filterEncounters,
  filterLabs,
  filterPrescriptions,
  TIMELINE_YEARS,
  timelineQuerySchema,
} from "@/services/dental_chart";
import { loadDentalChart } from "@/services/dental_chart/loadChart";
import { requireAdmin } from "@/lib/api/requireAdmin";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Params) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id } = await context.params;
  const url = new URL(request.url);
  const parsed = timelineQuerySchema.safeParse({
    start: url.searchParams.get("start") ?? 2015,
    end: url.searchParams.get("end") ?? 2016,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const range = {
    startYear: Math.min(parsed.data.start, parsed.data.end),
    endYear: Math.max(parsed.data.start, parsed.data.end),
  };
  const chart = await loadDentalChart(auth.supabase, id);
  if (!chart) {
    return NextResponse.json({ error: "Patient not found" }, { status: 404 });
  }
  const encounters = filterEncounters(chart.encounters, range);
  return NextResponse.json({
    range,
    encounters,
    prescriptions: filterPrescriptions(chart.prescriptions, range),
    labs: filterLabs(chart.labs, range),
    ticks: clusterTimelineTicks(
      encounters.map((item) => item.timestamp),
      TIMELINE_YEARS,
      1,
    ),
  });
}
