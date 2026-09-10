/**
 * Patients who asked not to be messaged.
 *
 * Opt-outs are keyed on the last 8 digits so one entry covers every format a
 * number is written in. Adding one withdraws anything already queued for that
 * patient, so the request takes effect immediately rather than after whatever
 * was already scheduled has gone out.
 */

import type { createServiceClient } from "@/lib/supabase/service";
import { phoneSuffixForLookup } from "@/services/reservations/phoneSuffix";

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * Whole-message phrases only. A substring match would opt a patient out for
 * "can you stop the drilling noise next time", and an opt-out is a much bigger
 * decision than a misread sentence should be able to make.
 *
 * "الغاء" alone is deliberately absent: it means "cancel", and a patient
 * replying it to a reminder is cancelling an appointment, not unsubscribing.
 */
const OPT_OUT_PHRASES = new Set([
  "stop",
  "stop all",
  "stop messages",
  "unsubscribe",
  "opt out",
  "optout",
  "ايقاف",
  "إيقاف",
  "وقف",
  "ايقاف الرسائل",
  "إيقاف الرسائل",
  "الغاء الاشتراك",
  "إلغاء الاشتراك",
]);

export function normalizeOptOutText(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    // Punctuation and symbols, which covers emoji: "🛑 STOP!" is still STOP.
    .replace(/[\p{P}\p{S}]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isOptOutMessage(text: string | null | undefined): boolean {
  const normalized = normalizeOptOutText(text ?? "");
  return normalized.length > 0 && OPT_OUT_PHRASES.has(normalized);
}

export async function addOptOut(
  db: ServiceClient,
  phone: string,
  reason: string,
): Promise<string> {
  const suffix = phoneSuffixForLookup(phone);
  if (!suffix) throw new Error("Phone number has no digits");

  const { error } = await db
    .from("patient_notification_optouts")
    .upsert({ phone_suffix: suffix, phone, reason }, { onConflict: "phone_suffix" });
  if (error) throw new Error(error.message);

  await db
    .from("patient_notifications")
    .update({
      status: "superseded",
      skip_reason: "opted_out",
      updated_at: new Date().toISOString(),
    })
    .eq("phone_suffix", suffix)
    .eq("status", "pending");

  return suffix;
}

export async function removeOptOut(db: ServiceClient, phoneSuffix: string): Promise<void> {
  const { error } = await db
    .from("patient_notification_optouts")
    .delete()
    .eq("phone_suffix", phoneSuffix);
  if (error) throw new Error(error.message);
}

export async function listOptOuts(db: ServiceClient) {
  const { data, error } = await db
    .from("patient_notification_optouts")
    .select("phone_suffix,phone,reason,created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return data ?? [];
}
