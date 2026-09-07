import { createClient } from "@/lib/supabase/client";
import type { ExperienceEntry } from "./types";

export async function listExperience(): Promise<ExperienceEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("experience_entries")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}
