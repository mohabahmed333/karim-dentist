import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type {
  ClinicKnowledge,
  ClinicKnowledgeInsert,
  ClinicKnowledgeUpdate,
} from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createClinicKnowledge(
  supabase: AnySupabase,
  payload: ClinicKnowledgeInsert,
): Promise<ClinicKnowledge> {
  const { data, error } = await supabase
    .from("clinic_knowledge")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateClinicKnowledge(
  supabase: AnySupabase,
  id: string,
  payload: ClinicKnowledgeUpdate,
): Promise<ClinicKnowledge> {
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
export async function softDeleteClinicKnowledge(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("clinic_knowledge")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
