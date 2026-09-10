import type { createServiceClient } from "@/lib/supabase/service";
import { processAutoReplyJob } from "./processJob";

type ServiceClient = ReturnType<typeof createServiceClient>;

const LEASE_GRACE_MS = 2 * 60_000;
const MAX_LLM_ATTEMPTS = 3;

export type SweepResult = { id: string; outcome: string };

/**
 * Recover auto-reply jobs that were interrupted.
 *
 * `after()` is not durable: if the invocation is killed mid-callback the job is
 * left `running` with a lease that never expires on its own. This picks those
 * up, along with anything queued but never started.
 *
 * A job that already reached the send call is never retried — `send_started_at`
 * means Meta may have accepted the message, and a duplicate WhatsApp message to
 * a patient is worse than a missed one. Those are abandoned for staff instead.
 *
 * Called from two places: the daily cron, and opportunistically from the
 * webhook so recovery does not have to wait for it.
 */
export async function sweepStaleAutoReplyJobs(
  db: ServiceClient,
  limit = 5,
): Promise<SweepResult[]> {
  const staleBefore = new Date(Date.now() - LEASE_GRACE_MS).toISOString();

  const { data: jobs, error } = await db
    .from("whatsapp_ai_jobs")
    .select("id,status,attempts,send_started_at")
    .in("status", ["queued", "running"])
    .lt("updated_at", staleBefore)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error) throw error;

  const results: SweepResult[] = [];
  for (const job of jobs ?? []) {
    if (job.send_started_at) {
      await abandon(db, job.id, "Interrupted after send began — not retried");
      results.push({ id: job.id, outcome: "abandoned_after_send" });
      continue;
    }
    if ((job.attempts ?? 0) >= MAX_LLM_ATTEMPTS) {
      await abandon(db, job.id, "Exhausted retries");
      results.push({ id: job.id, outcome: "abandoned_retries" });
      continue;
    }
    results.push({
      id: job.id,
      outcome: await processAutoReplyJob(db, job.id),
    });
  }
  return results;
}

async function abandon(db: ServiceClient, id: string, reason: string) {
  await db
    .from("whatsapp_ai_jobs")
    .update({
      status: "abandoned",
      last_error: reason,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
}
