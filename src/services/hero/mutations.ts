import { createClient } from "@/lib/supabase/client";
import type { Hero, HeroUpdate } from "./types";

export async function updateHero(
  id: string,
  payload: HeroUpdate,
): Promise<Hero> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("hero")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
