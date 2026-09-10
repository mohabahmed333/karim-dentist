import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api/requireAdmin";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

const STATUSES = new Set(["pending", "sending", "sent", "failed", "skipped", "superseded", "abandoned"]);
const KINDS = new Set([
  "confirmation", "reschedule", "cancellation", "reminder_24h",
  "followup", "recall_6m", "waitlist_offer", "review_request",
]);

/** The most recent queued messages, so "why didn't she get it?" has an answer. */
export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const params = new URL(request.url).searchParams;
  let query = createServiceClient()
    .from("patient_notifications")
    .select(
      "id,kind,status,skip_reason,patient_name,phone,language,template_name,scheduled_for,sent_at,created_at,last_error",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const status = params.get("status");
  if (status && STATUSES.has(status)) query = query.eq("status", status);
  const kind = params.get("kind");
  if (kind && KINDS.has(kind)) query = query.eq("kind", kind);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ rows: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}
