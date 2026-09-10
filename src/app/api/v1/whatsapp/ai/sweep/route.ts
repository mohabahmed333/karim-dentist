import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { processAutoReplyJob } from "@/services/whatsapp_ai/processJob";

export const runtime = "nodejs";
export const maxDuration = 60;

const BATCH = 5;
const LEASE_GRACE_MS = 2 * 60_000;
const MAX_LLM_ATTEMPTS = 3;

/**
 * Crash backstop for the auto-responder.
 *
 * `after()` is not durable — if the invocation is killed mid-callback the job
 * row is left `running` with an expired lease. This picks those up, plus any
 * job that was queued but never started.
 *
 * A job that already reached the send call is never retried: `send_started_at`
 * means Meta may have accepted the message, and a duplicate WhatsApp message to
 * a patient is worse than a missed one. Those are abandoned for staff instead.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (secret) {
    const provided =
      request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
      request.headers.get("x-cron-secret") ??
      "";
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = createServiceClient();
  const staleBefore = new Date(Date.now() - LEASE_GRACE_MS).toISOString();

  const { data: jobs, error } = await db
    .from("whatsapp_ai_jobs")
    .select("id,status,attempts,send_started_at")
    .in("status", ["queued", "running"])
    .lt("updated_at", staleBefore)
    .order("created_at", { ascending: true })
    .limit(BATCH);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Record<string, string> = {};
  for (const job of jobs ?? []) {
    if (job.send_started_at) {
      await db
        .from("whatsapp_ai_jobs")
        .update({
          status: "abandoned",
          last_error: "Interrupted after send began — not retried",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      results[job.id] = "abandoned_after_send";
      continue;
    }
    if ((job.attempts ?? 0) >= MAX_LLM_ATTEMPTS) {
      await db
        .from("whatsapp_ai_jobs")
        .update({
          status: "abandoned",
          last_error: "Exhausted retries",
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);
      results[job.id] = "abandoned_retries";
      continue;
    }
    results[job.id] = await processAutoReplyJob(db, job.id);
  }

  return NextResponse.json({ swept: Object.keys(results).length, results });
}
