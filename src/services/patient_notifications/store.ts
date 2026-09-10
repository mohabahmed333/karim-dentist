/**
 * Database access for the notification outbox.
 *
 * Mirrors src/services/whatsapp_ai/store.ts, including its locking discipline:
 * claiming is a conditional UPDATE that doubles as a lease, so the cron and a
 * manual dispatch can both run without racing.
 */

import type { TablesUpdate } from "@/lib/supabase/database.types";
import type { createServiceClient } from "@/lib/supabase/service";
import { phoneSuffixForLookup } from "@/services/reservations/phoneSuffix";
import type { DispatchSettings } from "./dispatchPolicy";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** Long enough for a slow Kapso call, short enough that a crash frees the row. */
const LEASE_SECONDS = 90;

export const DEFAULT_SETTINGS: DispatchSettings = {
  mode: "off",
  timezone: "Africa/Cairo",
  quiet_hours_start: 22,
  quiet_hours_end: 9,
  max_per_patient_per_day: 3,
};

export async function loadSettings(db: ServiceClient): Promise<DispatchSettings> {
  const { data } = await db
    .from("patient_notification_settings")
    .select("mode,timezone,quiet_hours_start,quiet_hours_end,max_per_patient_per_day")
    .limit(1)
    .maybeSingle();
  // Absent settings must read as "off", never as "send".
  return data ? (data as DispatchSettings) : DEFAULT_SETTINGS;
}

export type DueNotification = {
  id: string;
  kind: string;
  source: string;
  phone: string;
  patient_name: string;
  service_label: string;
  starts_at: string | null;
  scheduled_for: string;
  conversation_id: string | null;
  attempts: number;
};

/** Rows whose time has come, oldest first. */
export async function findDue(
  db: ServiceClient,
  now: Date,
  limit: number,
): Promise<DueNotification[]> {
  const { data } = await db
    .from("patient_notifications")
    .select(
      "id,kind,source,phone,patient_name,service_label,starts_at,scheduled_for,conversation_id,attempts",
    )
    .eq("status", "pending")
    .lte("scheduled_for", now.toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(limit);
  return (data ?? []) as DueNotification[];
}

/**
 * Take ownership of one row.
 *
 * The status filter is the lock: two dispatchers racing on the same row means
 * exactly one UPDATE matches, and the loser gets no row back.
 */
export async function claim(
  db: ServiceClient,
  id: string,
  now: Date,
  attempts: number,
): Promise<boolean> {
  const { data } = await db
    .from("patient_notifications")
    .update({
      status: "sending",
      lease_until: new Date(now.getTime() + LEASE_SECONDS * 1000).toISOString(),
      attempts: attempts + 1,
      updated_at: now.toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  return Boolean(data?.length);
}

export type FinishPatch = {
  status: "sent" | "failed" | "skipped" | "abandoned" | "pending";
  skipReason?: string | null;
  lastError?: string | null;
  scheduledFor?: string;
  language?: string | null;
  templateName?: string | null;
  payload?: Record<string, unknown> | null;
  conversationId?: string | null;
  outboundMessageId?: string | null;
  sentAt?: string | null;
};

export async function finish(
  db: ServiceClient,
  id: string,
  patch: FinishPatch,
): Promise<void> {
  const row: TablesUpdate<"patient_notifications"> = {
    status: patch.status,
    updated_at: new Date().toISOString(),
    lease_until: null,
  };
  if (patch.skipReason !== undefined) row.skip_reason = patch.skipReason;
  if (patch.lastError !== undefined) row.last_error = patch.lastError;
  if (patch.scheduledFor) row.scheduled_for = patch.scheduledFor;
  if (patch.language !== undefined) row.language = patch.language;
  if (patch.templateName !== undefined) row.template_name = patch.templateName;
  if (patch.payload !== undefined) row.payload = patch.payload as TablesUpdate<"patient_notifications">["payload"];
  if (patch.conversationId !== undefined) row.conversation_id = patch.conversationId;
  if (patch.outboundMessageId !== undefined) {
    row.outbound_message_id = patch.outboundMessageId;
  }
  if (patch.sentAt !== undefined) row.sent_at = patch.sentAt;
  await db.from("patient_notifications").update(row).eq("id", id);
}

/**
 * Record that the send is about to happen.
 *
 * Written before the Kapso call so a crash past this point is abandoned rather
 * than retried: a provider timeout is ambiguous, and a duplicate WhatsApp
 * message to a patient is worse than a missed one.
 */
export async function markSendStarted(
  db: ServiceClient,
  id: string,
): Promise<void> {
  await db
    .from("patient_notifications")
    .update({ send_started_at: new Date().toISOString() })
    .eq("id", id);
}

export async function isOptedOut(
  db: ServiceClient,
  phone: string,
): Promise<boolean> {
  const suffix = phoneSuffixForLookup(phone);
  if (!suffix) return false;
  const { data } = await db
    .from("patient_notification_optouts")
    .select("phone_suffix")
    .eq("phone_suffix", suffix)
    .maybeSingle();
  return Boolean(data);
}

/** How many notifications this patient has already had in the last 24 hours. */
export async function countSentLast24h(
  db: ServiceClient,
  phone: string,
  now: Date,
): Promise<number> {
  const suffix = phoneSuffixForLookup(phone);
  if (!suffix) return 0;
  const since = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await db
    .from("patient_notifications")
    .select("id", { count: "exact", head: true })
    .eq("phone_suffix", suffix)
    .eq("status", "sent")
    .gte("sent_at", since);
  return count ?? 0;
}

/** Rows whose lease expired: returned to the queue, or abandoned if mid-send. */
export async function sweepExpiredLeases(
  db: ServiceClient,
  now: Date,
): Promise<number> {
  const expired = now.toISOString();
  // Mid-send when the lease lapsed: Meta may already have the message.
  const { data: abandoned } = await db
    .from("patient_notifications")
    .update({ status: "abandoned", lease_until: null, last_error: "lease_expired_mid_send" })
    .eq("status", "sending")
    .lt("lease_until", expired)
    .not("send_started_at", "is", null)
    .select("id");

  const { data: returned } = await db
    .from("patient_notifications")
    .update({ status: "pending", lease_until: null })
    .eq("status", "sending")
    .lt("lease_until", expired)
    .is("send_started_at", null)
    .select("id");

  return (abandoned?.length ?? 0) + (returned?.length ?? 0);
}
