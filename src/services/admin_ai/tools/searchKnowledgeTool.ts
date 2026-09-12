import { z } from "zod";
import { selectRelevant } from "@/services/clinic_knowledge/search";
import type { ToolDb } from "./types";

export const searchKnowledgeArgs = z.object({
  query: z.string().min(1).max(200),
});
export type SearchKnowledgeArgs = z.infer<typeof searchKnowledgeArgs>;

type SearchRow = { title: string; title_ar: string; body: string; body_ar: string; rank: number };

/**
 * Clinic policies and FAQs — the same lookup the WhatsApp auto-responder uses
 * (`clinic_knowledge/search.ts`), minus its bilingual picking: Clinic Assist
 * already knows which language to answer in from the chat context, so both
 * columns are returned and it decides.
 */
export async function searchKnowledgeTool(db: ToolDb, args: SearchKnowledgeArgs) {
  const { data, error } = await db.rpc("search_clinic_knowledge", {
    p_query: args.query,
    p_limit: 4,
  });
  // Retrieval is an enhancement: a failed lookup is "found nothing", not a
  // reason to fail the whole chat turn.
  if (error || !data) return [];

  return selectRelevant(data as SearchRow[]).map((row) => ({
    title: row.title || row.title_ar,
    body: row.body || row.body_ar,
  }));
}
