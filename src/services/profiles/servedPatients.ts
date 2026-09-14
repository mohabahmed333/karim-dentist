import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export type ServedPatient = {
  patientKey: string;
  name: string | null;
  phone: string | null;
  /** Why this patient is linked to the staff member. */
  reasons: ("conversation" | "clinical")[];
};

/**
 * Patients a staff member actually serves, derived from the links that exist
 * in the schema rather than an explicit assignment:
 *   - WhatsApp conversations assigned to them
 *   - clinical notes, prescriptions and lab orders they authored
 *
 * There is no dentist column on reservations, so appointments can't be
 * attributed to a staff member.
 */
export async function listServedPatients(
  supabase: ServerSupabase,
  userId: string,
): Promise<ServedPatient[]> {
  const [conversations, notes, prescriptions, labOrders] = await Promise.all([
    supabase
      .from("whatsapp_conversations")
      .select("patient_key, contact_name, phone_number")
      .eq("assignee_id", userId)
      .not("patient_key", "is", null),
    supabase
      .from("patient_clinical_notes")
      .select("patient_key")
      .eq("created_by", userId),
    supabase
      .from("patient_prescriptions")
      .select("patient_key")
      .eq("created_by", userId),
    supabase
      .from("patient_lab_orders")
      .select("patient_key")
      .eq("created_by", userId),
  ]);

  const byKey = new Map<string, ServedPatient>();
  const add = (
    key: string | null,
    reason: ServedPatient["reasons"][number],
    fallback?: { name?: string | null; phone?: string | null },
  ) => {
    if (!key) return;
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.reasons.includes(reason)) existing.reasons.push(reason);
      return;
    }
    byKey.set(key, {
      patientKey: key,
      name: fallback?.name ?? null,
      phone: fallback?.phone ?? null,
      reasons: [reason],
    });
  };

  for (const row of conversations.data ?? []) {
    add(row.patient_key, "conversation", {
      name: row.contact_name,
      phone: row.phone_number,
    });
  }
  for (const row of notes.data ?? []) add(row.patient_key, "clinical");
  for (const row of prescriptions.data ?? []) add(row.patient_key, "clinical");
  for (const row of labOrders.data ?? []) add(row.patient_key, "clinical");

  const keys = [...byKey.keys()];
  if (keys.length === 0) return [];

  // Prefer the real patient record's name/phone over the conversation's.
  const { data: profiles } = await supabase
    .from("patients")
    .select("patient_key, display_name, phone")
    .in("patient_key", keys);

  for (const profile of profiles ?? []) {
    const entry = byKey.get(profile.patient_key);
    if (!entry) continue;
    entry.name = profile.display_name ?? entry.name;
    entry.phone = profile.phone ?? entry.phone;
  }

  return [...byKey.values()].sort((a, b) =>
    (a.name ?? a.patientKey).localeCompare(b.name ?? b.patientKey),
  );
}
