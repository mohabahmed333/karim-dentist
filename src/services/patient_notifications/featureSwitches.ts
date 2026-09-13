/**
 * The per-feature off switch.
 *
 * Every other condition answers "can this run" — a template approved, a key
 * set, the right mode. This one answers "do we want it", which nothing else
 * did: a clinic that wanted reminders but not follow-ups had to withhold a
 * template to stop them.
 *
 * A switch is ANDed with everything else and can only ever veto. Unknown or
 * unreadable means on, so a feature never stops because a row is missing or a
 * query failed — the failure a clinic notices is messages that stop arriving,
 * and it should take a deliberate act to cause it.
 */

import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** Feature keys, matching the readiness checklist so a switch sits on its row. */
export const SWITCHABLE_FEATURES = [
  "confirmations",
  "reminders",
  "cancellations",
  "reschedules",
  "waitlist",
  "followups",
  "recalls",
  "reviews",
  "cancel_by_reply",
  "voice_notes",
  "knowledge",
  "review_queue",
  "stop",
] as const;

export type SwitchableFeature = (typeof SWITCHABLE_FEATURES)[number];

export type FeatureSwitches = Partial<Record<string, boolean>>;

/**
 * Which feature an outbox row belongs to.
 *
 * The dispatcher works in message kinds and the checklist in features, and
 * this is the only place the two are tied together — so a new kind that nobody
 * mapped is simply not switchable rather than silently unswitchable.
 */
const KIND_TO_FEATURE: Record<string, SwitchableFeature> = {
  confirmation: "confirmations",
  reminder_24h: "reminders",
  cancellation: "cancellations",
  reschedule: "reschedules",
  waitlist_offer: "waitlist",
  followup: "followups",
  recall_6m: "recalls",
  review_request: "reviews",
};

export function featureForKind(kind: string): SwitchableFeature | null {
  return KIND_TO_FEATURE[kind] ?? null;
}

/**
 * Is this feature switched on?
 *
 * Anything not explicitly off is on: an absent row, an unknown key, a failed
 * read. Turning something off has to be a decision somebody made.
 */
export function isFeatureOn(switches: FeatureSwitches, feature: string | null): boolean {
  if (!feature) return true;
  return switches[feature] !== false;
}

/** Whether the row's own feature is switched on. */
export function isKindOn(switches: FeatureSwitches, kind: string): boolean {
  return isFeatureOn(switches, featureForKind(kind));
}

export async function loadFeatureSwitches(db: ServiceClient): Promise<FeatureSwitches> {
  const { data, error } = await db
    .from("notification_feature_switches")
    .select("feature_key,enabled");
  if (error || !data) return {};

  const out: FeatureSwitches = {};
  for (const row of data) out[row.feature_key] = row.enabled;
  return out;
}

export async function setFeatureSwitch(
  db: ServiceClient,
  feature: string,
  enabled: boolean,
): Promise<boolean> {
  const { error } = await db
    .from("notification_feature_switches")
    .upsert(
      { feature_key: feature, enabled, updated_at: new Date().toISOString() },
      { onConflict: "feature_key" },
    );
  return !error;
}
