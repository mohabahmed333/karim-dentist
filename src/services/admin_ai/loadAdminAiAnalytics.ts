import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import {
  feedbackRate,
  summarizeOutcomes,
  topFailingActionKinds,
  type AuditOutcome,
} from "./analyticsAggregate";

export type AdminAiAnalytics = {
  windowDays: number;
  outcomeCounts: Record<AuditOutcome, number>;
  topFailingKinds: { kind: string; count: number }[];
  feedbackUp: number;
  feedbackDown: number;
  feedbackRatePercent: number | null;
};

const DEFAULT_WINDOW_DAYS = 7;

/**
 * How the AI action registry and Clinic Assist's replies have actually been
 * doing, over the last `windowDays` — confirm/cancel/fail/stale counts from
 * the audit trail every proposal already writes, plus the thumbs feedback
 * staff leave on replies. Nothing here is itself audited or reviewed by a
 * person before being written, so a query failure here degrades to zeros
 * rather than breaking the page.
 */
export async function loadAdminAiAnalytics(
  db: SupabaseClient<Database>,
  windowDays: number = DEFAULT_WINDOW_DAYS,
  now: Date = new Date(),
): Promise<AdminAiAnalytics> {
  const since = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000).toISOString();

  const [eventsRes, upRes, downRes] = await Promise.all([
    db
      .from("ai_action_audit_events")
      .select("outcome, action_kind")
      .gte("created_at", since),
    db
      .from("clinic_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "assistant")
      .eq("meta->>feedback", "up")
      .gte("created_at", since),
    db
      .from("clinic_chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("role", "assistant")
      .eq("meta->>feedback", "down")
      .gte("created_at", since),
  ]);

  const rows = eventsRes.error ? [] : (eventsRes.data ?? []);
  const up = upRes.error ? 0 : (upRes.count ?? 0);
  const down = downRes.error ? 0 : (downRes.count ?? 0);

  return {
    windowDays,
    outcomeCounts: summarizeOutcomes(rows),
    topFailingKinds: topFailingActionKinds(rows),
    feedbackUp: up,
    feedbackDown: down,
    feedbackRatePercent: feedbackRate(up, down),
  };
}
