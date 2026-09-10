/**
 * Reviewing what staff changed in the assistant's drafts.
 *
 * "Promote" deliberately does not append to a test file. Nothing in this app
 * writes to disk at runtime, and Vercel's filesystem is read-only, so a button
 * that edits a fixture could never work in production. Instead there are two
 * honest routes out of the queue:
 *
 *   - promote to knowledge: the staff member's wording becomes an UNPUBLISHED
 *     clinic_knowledge entry. When the correction was a fact the assistant
 *     lacked — a price, a policy — that closes the gap at runtime, and
 *     unpublished means a human still decides it is safe to quote.
 *   - export: the reviewed examples as JSON, for a developer to turn into
 *     golden cases in the repo, where tests belong.
 */

import type { createServiceClient } from "@/lib/supabase/service";

type ServiceClient = ReturnType<typeof createServiceClient>;

export type CorrectionRow = {
  id: string;
  conversation_id: string | null;
  ai_text: string;
  sent_text: string;
  edited: boolean;
  intent: string | null;
  reason: string | null;
  reviewed: boolean;
  promoted: boolean;
  created_at: string;
};

const COLUMNS =
  "id,conversation_id,ai_text,sent_text,edited,intent,reason,reviewed,promoted,created_at";

/** The review queue: real edits nobody has looked at yet, newest first. */
export async function listCorrections(
  db: ServiceClient,
  opts: { includeReviewed?: boolean; limit?: number } = {},
): Promise<CorrectionRow[]> {
  let query = db
    .from("whatsapp_ai_corrections")
    .select(COLUMNS)
    .eq("edited", true)
    .order("created_at", { ascending: false })
    .limit(Math.min(opts.limit ?? 50, 200));
  if (!opts.includeReviewed) query = query.eq("reviewed", false);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as CorrectionRow[];
}

export async function markReviewed(db: ServiceClient, id: string): Promise<void> {
  const { error } = await db
    .from("whatsapp_ai_corrections")
    .update({ reviewed: true })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

/** Pure: a first-draft knowledge entry from one correction. */
export function knowledgeDraftFrom(row: Pick<CorrectionRow, "sent_text" | "intent">) {
  const text = row.sent_text.trim();
  const arabic = /[؀-ۿ]/.test(text);
  const title = (row.intent ? row.intent.replace(/_/g, " ") : "Staff answer").slice(0, 80);
  return {
    title,
    title_ar: "",
    body: arabic ? "" : text,
    body_ar: arabic ? text : "",
    tags: ["from-correction"],
    // Unpublished: a reply that was right for one patient in one conversation
    // is not automatically a fact to quote to everyone.
    is_published: false,
  };
}

export async function promoteToKnowledge(
  db: ServiceClient,
  id: string,
): Promise<{ knowledgeId: string }> {
  const { data: row, error } = await db
    .from("whatsapp_ai_corrections")
    .select("sent_text,intent,promoted")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Correction not found");

  const { data: created, error: insertError } = await db
    .from("clinic_knowledge")
    .insert(knowledgeDraftFrom(row))
    .select("id")
    .single();
  if (insertError) throw new Error(insertError.message);

  await db
    .from("whatsapp_ai_corrections")
    .update({ promoted: true, reviewed: true })
    .eq("id", id);
  return { knowledgeId: created.id };
}

/** Reviewed examples as JSON, for turning into golden cases in the repo. */
export async function exportReviewed(db: ServiceClient) {
  const rows = await listCorrections(db, { includeReviewed: true, limit: 200 });
  return rows
    .filter((r) => r.reviewed)
    .map((r) => ({
      intent: r.intent,
      reason: r.reason,
      assistantProposed: r.ai_text,
      staffSent: r.sent_text,
      createdAt: r.created_at,
    }));
}
