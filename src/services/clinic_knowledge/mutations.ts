import { createClient } from "@/lib/supabase/client";
import type {
  ClinicKnowledge,
  ClinicKnowledgeInsert,
  ClinicKnowledgeUpdate,
} from "./types";

export async function createClinicKnowledge(
  payload: ClinicKnowledgeInsert,
): Promise<ClinicKnowledge> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_knowledge")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClinicKnowledge(
  id: string,
  payload: ClinicKnowledgeUpdate,
): Promise<ClinicKnowledge> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_knowledge")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Soft delete, so an entry the assistant once quoted can be recovered. */
export async function softDeleteClinicKnowledge(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("clinic_knowledge")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
