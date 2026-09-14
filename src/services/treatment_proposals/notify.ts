import type { createClient as createServerClient } from "@/lib/supabase/server";
import { formatEgp } from "@/services/deposits/receiptMessages";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Queues the WhatsApp notification through the same outbox every other
 * patient message goes through. "treatment_proposal" has no Meta-approved
 * template yet (see Global Constraints) — buildTemplateForKind's existing
 * default branch already skips a kind with no template cleanly, so this
 * queues correctly today and starts actually sending the moment a template
 * is approved and wired in, with no code change needed here.
 *
 * Takes only the two fields it actually renders, not a full ProposalItem —
 * the caller has draft items with no id yet at create time.
 */
export async function enqueueTreatmentProposalNotification(
  supabase: ServerSupabase,
  input: {
    proposalId: string;
    patientPhone: string;
    patientName: string;
    doctorName: string;
    items: { description: string; amountEgp: number }[];
  },
): Promise<void> {
  const serviceList = input.items
    .map((item) => `${item.description} (${formatEgp(item.amountEgp, "en")})`)
    .join(", ");
  const total = input.items.reduce((sum, item) => sum + item.amountEgp, 0);
  const summary = `${serviceList} — ${input.doctorName} — Total ${formatEgp(total, "en")}`;

  const { error } = await supabase.from("patient_notifications").upsert(
    {
      kind: "treatment_proposal",
      dedupe_key: `${input.proposalId}:treatment_proposal`,
      reservation_id: null,
      phone: input.patientPhone,
      patient_name: input.patientName,
      service_label: summary,
      starts_at: null,
      source: "manual",
      scheduled_for: new Date().toISOString(),
    },
    { onConflict: "dedupe_key", ignoreDuplicates: true },
  );
  if (error) throw error;
}
