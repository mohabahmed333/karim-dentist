import { createClient } from "@/lib/supabase/client";
import type {
  ExperienceEntry,
  ExperienceInsert,
  ExperienceUpdate,
} from "./types";

export async function createExperience(
  payload: ExperienceInsert,
): Promise<ExperienceEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("experience_entries")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateExperience(
  id: string,
  payload: ExperienceUpdate,
): Promise<ExperienceEntry> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("experience_entries")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteExperience(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("experience_entries")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
