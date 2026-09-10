import type { Tables, TablesInsert, TablesUpdate } from "@/lib/supabase/database.types";

export type ClinicKnowledge = Tables<"clinic_knowledge">;
export type ClinicKnowledgeInsert = TablesInsert<"clinic_knowledge">;
export type ClinicKnowledgeUpdate = TablesUpdate<"clinic_knowledge">;

/** One retrieved entry, already reduced to the language being replied in. */
export type KnowledgeHit = {
  title: string;
  body: string;
};
