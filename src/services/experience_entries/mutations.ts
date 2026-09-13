import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type {
  ExperienceEntry,
  ExperienceInsert,
  ExperienceUpdate,
} from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createExperience(
  supabase: AnySupabase,
  payload: ExperienceInsert,
): Promise<ExperienceEntry> {
  const { data, error } = await supabase
    .from("experience_entries")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExperience(
  supabase: AnySupabase,
  id: string,
  payload: ExperienceUpdate,
): Promise<ExperienceEntry> {
  const { data, error } = await supabase
    .from("experience_entries")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteExperience(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("experience_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
