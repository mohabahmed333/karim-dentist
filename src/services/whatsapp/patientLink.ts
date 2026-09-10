import {
  canonicalPhoneDigits,
  phonesMatch,
} from "@/services/reservations/patientHistory";
import type { createServiceClient } from "@/lib/supabase/service";
import { phoneSuffixForLookup } from "@/services/reservations/phoneSuffix";

type ServiceClient = ReturnType<typeof createServiceClient>;

export async function resolvePatientKeyByPhone(
  supabase: ServiceClient,
  phone: string,
): Promise<string | null> {
  const digits = canonicalPhoneDigits(phone);
  if (!digits) return null;
  const suffix = phoneSuffixForLookup(phone);
  if (!suffix) return null;

  // Narrow in Postgres on the indexed generated column, then let phonesMatch
  // make the exact call below. Scanning every reservation here ran on each
  // inbound webhook message.
  const { data } = await supabase
    .from("reservations")
    .select("phone, patient_name, id")
    .is("deleted_at", null)
    .eq("phone_suffix", suffix)
    .limit(500);
  if (!data?.length) return null;

  const counts = new Map<string, { phone: string; visits: number }>();
  for (const row of data) {
    if (!phonesMatch(row.phone, phone)) continue;
    const key = canonicalPhoneDigits(row.phone);
    const prev = counts.get(key) ?? { phone: row.phone, visits: 0 };
    prev.visits += 1;
    if (row.phone.trim().startsWith("+")) prev.phone = row.phone;
    counts.set(key, prev);
  }

  let best: { phone: string; visits: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.visits > best.visits) best = entry;
  }
  if (!best) return null;
  const phoneKey = canonicalPhoneDigits(best.phone);
  return phoneKey ? `phone:${phoneKey}` : null;
}
