/**
 * Messages that come from the passage of time rather than from a booking.
 *
 *   followup   — the day after a completed visit: "how are you feeling?"
 *   recall_6m  — a patient whose last completed visit is six months old and who
 *                has nothing booked: "you're due a check-up".
 *
 * Unlike confirmations these have no triggering row, so a scan finds them. The
 * scan runs on every dispatch tick, which is safe because every enqueue is
 * idempotent through dedupe_key — running it a thousand times queues each
 * message once.
 *
 * The selection is pure so the rules can be tested without a database.
 */

import type { createServiceClient } from "@/lib/supabase/service";
import { phoneSuffixForLookup } from "@/services/reservations/phoneSuffix";

type ServiceClient = ReturnType<typeof createServiceClient>;

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Long enough that the visit is over and the patient is home. */
const FOLLOWUP_AFTER = 18 * HOUR;
/** Past this, "how did it go?" reads as an afterthought rather than care. */
const FOLLOWUP_UNTIL = 3 * DAY;
const RECALL_AFTER = 180 * DAY;
/** How long after a follow-up a reply still counts as answering it. */
const REVIEW_REPLY_WINDOW = 3 * DAY;

export type VisitRow = {
  id: string;
  phone: string;
  patient_name: string;
  service_label: string;
  starts_at: string;
  status: string;
};

export type Enqueue = {
  kind: "followup" | "recall_6m" | "review_request";
  dedupe_key: string;
  reservation_id: string | null;
  phone: string;
  patient_name: string;
  service_label: string;
  starts_at: string | null;
};

export function selectFollowups(visits: VisitRow[], now: Date): Enqueue[] {
  return visits
    .filter((v) => v.status === "completed")
    .filter((v) => {
      const since = now.getTime() - Date.parse(v.starts_at);
      return since >= FOLLOWUP_AFTER && since <= FOLLOWUP_UNTIL;
    })
    .map((v) => ({
      kind: "followup" as const,
      dedupe_key: `${v.id}:followup`,
      reservation_id: v.id,
      phone: v.phone,
      patient_name: v.patient_name,
      service_label: v.service_label,
      starts_at: null,
    }));
}

/**
 * One recall per lapsed patient, judged by their most recent completed visit.
 *
 * Keyed on that visit, so a patient who comes back and lapses again is recalled
 * again — but the same lapse is never recalled twice.
 */
export function selectRecalls(
  visits: VisitRow[],
  upcomingPhoneSuffixes: Set<string>,
  now: Date,
): Enqueue[] {
  const latest = new Map<string, VisitRow>();
  for (const v of visits) {
    if (v.status !== "completed") continue;
    const suffix = phoneSuffixForLookup(v.phone);
    if (!suffix) continue;
    const prev = latest.get(suffix);
    if (!prev || Date.parse(v.starts_at) > Date.parse(prev.starts_at)) latest.set(suffix, v);
  }

  const out: Enqueue[] = [];
  for (const [suffix, v] of latest) {
    // Already coming back: a recall would be noise, and slightly insulting.
    if (upcomingPhoneSuffixes.has(suffix)) continue;
    if (now.getTime() - Date.parse(v.starts_at) < RECALL_AFTER) continue;
    out.push({
      kind: "recall_6m",
      dedupe_key: `${suffix}:recall_6m:${v.id}`,
      reservation_id: null,
      phone: v.phone,
      patient_name: v.patient_name,
      service_label: v.service_label,
      starts_at: null,
    });
  }
  return out;
}

export type SentFollowup = {
  id: string;
  reservation_id: string | null;
  conversation_id: string | null;
  phone: string;
  patient_name: string;
  service_label: string;
  sent_at: string | null;
};

export type FeedbackEvent = {
  conversation_id: string | null;
  intent: string | null;
  created_at: string;
};

/**
 * Ask for a review only from a patient who has just said they are happy.
 *
 * Driven by the assistant's classification of their reply to the follow-up.
 * Any negative reply in the same window vetoes it, even alongside a positive
 * one — "the filling is fine but I waited an hour" is not someone to send to
 * Google. Asking an unhappy patient to rate you publicly is how a clinic earns
 * its one-star reviews.
 */
export function selectReviewRequests(
  followups: SentFollowup[],
  events: FeedbackEvent[],
): Enqueue[] {
  const out: Enqueue[] = [];
  for (const f of followups) {
    if (!f.conversation_id || !f.sent_at) continue;
    const sentAt = Date.parse(f.sent_at);
    const replies = events.filter((e) => {
      if (e.conversation_id !== f.conversation_id) return false;
      const at = Date.parse(e.created_at);
      return at > sentAt && at - sentAt <= REVIEW_REPLY_WINDOW;
    });
    if (replies.some((e) => e.intent === "feedback_negative")) continue;
    if (!replies.some((e) => e.intent === "feedback_positive")) continue;
    out.push({
      kind: "review_request",
      dedupe_key: `${f.id}:review_request`,
      reservation_id: f.reservation_id,
      phone: f.phone,
      patient_name: f.patient_name,
      service_label: f.service_label,
      starts_at: null,
    });
  }
  return out;
}

export async function enqueueFollowupsAndRecalls(
  db: ServiceClient,
  now: Date,
  opts: { recallEnabled: boolean },
): Promise<number> {
  const since = new Date(now.getTime() - (opts.recallEnabled ? 400 * DAY : FOLLOWUP_UNTIL)).toISOString();
  const [{ data: visits }, { data: upcoming }] = await Promise.all([
    db
      .from("reservations")
      .select("id,phone,patient_name,service_label,starts_at,status")
      .is("deleted_at", null)
      .eq("status", "completed")
      .gte("starts_at", since)
      .limit(5000),
    db
      .from("reservations")
      .select("phone")
      .is("deleted_at", null)
      .neq("status", "cancelled")
      .gte("starts_at", now.toISOString())
      .limit(5000),
  ]);

  const rows = (visits ?? []) as VisitRow[];
  const queue = [...selectFollowups(rows, now)];
  if (opts.recallEnabled) {
    const upcomingSuffixes = new Set(
      (upcoming ?? [])
        .map((r) => phoneSuffixForLookup(r.phone as string))
        .filter((s): s is string => Boolean(s)),
    );
    queue.push(...selectRecalls(rows, upcomingSuffixes, now));

    // Review requests ride the same marketing switch as recalls.
    const windowStart = new Date(now.getTime() - FOLLOWUP_UNTIL - REVIEW_REPLY_WINDOW).toISOString();
    const { data: followups } = await db
      .from("patient_notifications")
      .select("id,reservation_id,conversation_id,phone,patient_name,service_label,sent_at")
      .eq("kind", "followup")
      .eq("status", "sent")
      .not("conversation_id", "is", null)
      .gte("sent_at", windowStart)
      .limit(1000);
    const conversationIds = [
      ...new Set((followups ?? []).map((f) => f.conversation_id).filter((id): id is string => Boolean(id))),
    ];
    if (conversationIds.length > 0) {
      const { data: events } = await db
        .from("whatsapp_ai_events")
        .select("conversation_id,intent,created_at")
        .in("conversation_id", conversationIds)
        .in("intent", ["feedback_positive", "feedback_negative"])
        .gte("created_at", windowStart);
      queue.push(
        ...selectReviewRequests(
          (followups ?? []) as SentFollowup[],
          (events ?? []) as FeedbackEvent[],
        ),
      );
    }
  }
  if (queue.length === 0) return 0;

  const { data } = await db
    .from("patient_notifications")
    .upsert(
      queue.map((q) => ({ ...q, source: "schedule", scheduled_for: now.toISOString() })),
      { onConflict: "dedupe_key", ignoreDuplicates: true },
    )
    .select("id");
  return data?.length ?? 0;
}
