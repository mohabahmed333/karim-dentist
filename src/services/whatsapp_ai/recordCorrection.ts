/**
 * Capture what staff sent against what the assistant proposed.
 *
 * This is the only moment the comparison is possible: the send inserts a fresh
 * message row and deletes the draft, so a second later there is nothing left to
 * compare. Every edited draft is a labelled example of the assistant being
 * wrong in a way a human knew how to fix, and it was all being discarded.
 */

import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** Whitespace and case are not corrections. */
function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function wasEdited(aiText: string, sentText: string): boolean {
  return normalize(aiText) !== normalize(sentText);
}

export type RecordCorrectionInput = {
  conversationId: string;
  sentText: string;
  sentBy: string | null;
};

/**
 * Never throws: losing a training example must not fail a send that already
 * reached the patient.
 */
export async function recordDraftOutcome(
  db: ServiceClient,
  input: RecordCorrectionInput,
): Promise<void> {
  try {
    // The model's own words, from the event written when the draft was created.
    // Deliberately not the draft row's body, which an earlier "save" may
    // already have replaced with the staff member's wording.
    const { data: event } = await db
      .from("whatsapp_ai_events")
      .select("envelope,intent,reason,model")
      .eq("conversation_id", input.conversationId)
      .eq("decision", "draft")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!event) return;

    const envelope = (event.envelope ?? {}) as { reply?: unknown };
    const aiText = typeof envelope.reply === "string" ? envelope.reply : "";
    if (!aiText.trim()) return;

    await db.from("whatsapp_ai_corrections").insert({
      conversation_id: input.conversationId,
      ai_text: aiText,
      sent_text: input.sentText,
      // An unedited draft is recorded too: staff endorsing the assistant
      // verbatim is exactly what a golden case should be promoted from.
      edited: wasEdited(aiText, input.sentText),
      intent: event.intent,
      reason: event.reason,
      model: event.model,
      sent_by: input.sentBy,
    });
  } catch {
    // Intentionally silent.
  }
}
