/**
 * Retrieve clinic knowledge for one patient message.
 *
 * Postgres full-text rather than embeddings: at this scale it matches as well,
 * costs nothing per query, needs no extra infrastructure, and you can see why
 * something matched. The heavy lifting is in search_clinic_knowledge(), which
 * uses websearch_to_tsquery so that arbitrary public text can never produce a
 * syntax error or shape the query.
 */

import type { createServiceClient } from "@/lib/supabase/service";
import type { KnowledgeHit } from "./types";

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * Below this a match is coincidence rather than an answer. Deliberately low:
 * OR-ing the patient's lexemes produces small ts_rank values, so an absolute
 * cutoff can only sensibly exclude the clearly-irrelevant.
 */
const MIN_RANK = 0.01;

/**
 * The real filter, and the one that scales. Anything scoring far below the best
 * match is a different subject that happened to share a word, so entries are
 * kept relative to the top hit rather than against a fixed number nobody can
 * tune with confidence.
 */
const RELATIVE_FLOOR = 0.5;

/** Pure: which ranked rows are worth putting in front of the model. */
export function selectRelevant<T extends { rank: number }>(rows: T[]): T[] {
  const usable = rows.filter((row) => row.rank >= MIN_RANK);
  if (usable.length === 0) return [];
  const best = Math.max(...usable.map((row) => row.rank));
  return usable.filter((row) => row.rank >= best * RELATIVE_FLOOR);
}

type SearchRow = {
  title: string;
  title_ar: string;
  body: string;
  body_ar: string;
  rank: number;
};

/**
 * Reduce a bilingual row to the language being spoken.
 *
 * Falls back to the other language rather than returning nothing: an English
 * answer is more use to an Arabic speaker than a handoff, and the assistant is
 * instructed to reply in the patient's language regardless.
 */
function pick(row: SearchRow, language: "ar" | "en"): KnowledgeHit {
  const title = language === "ar" ? row.title_ar || row.title : row.title || row.title_ar;
  const body = language === "ar" ? row.body_ar || row.body : row.body || row.body_ar;
  return { title: title.trim(), body: body.trim() };
}

export async function searchClinicKnowledge(
  db: ServiceClient,
  query: string,
  language: "ar" | "en",
  limit = 4,
): Promise<KnowledgeHit[]> {
  const text = query.trim();
  if (!text) return [];

  const { data, error } = await db.rpc("search_clinic_knowledge", {
    p_query: text,
    p_limit: limit,
  });
  // Retrieval is an enhancement: if it fails the assistant should answer with
  // less context, never fall over.
  if (error || !data) return [];

  return selectRelevant(data as SearchRow[])
    .map((row) => pick(row, language))
    .filter((hit) => hit.title || hit.body);
}
