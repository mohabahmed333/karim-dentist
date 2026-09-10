import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";
import { gatherReadinessFacts } from "@/services/patient_notifications/gatherReadiness";
import {
  evaluateReadiness,
  requiredTemplateNames,
} from "@/services/patient_notifications/readiness";

export const runtime = "nodejs";

/** What is still missing before patients can be messaged. Admin only. */
export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const db = createServiceClient();
  const readiness = evaluateReadiness(await gatherReadinessFacts(db));

  // A rough picture of the queue, so "nothing is sending" can be told apart
  // from "nothing is queued".
  const { data: queue } = await db
    .from("patient_notifications")
    .select("status,skip_reason")
    .limit(1000);

  const counts: Record<string, number> = {};
  for (const row of queue ?? []) {
    const key = row.skip_reason ? `${row.status}:${row.skip_reason}` : row.status;
    counts[key] = (counts[key] ?? 0) + 1;
  }

  return NextResponse.json(
    { ...readiness, requiredTemplates: requiredTemplateNames(), queue: counts },
    { headers: { "Cache-Control": "no-store" } },
  );
}
