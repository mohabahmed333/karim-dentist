import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { Hero, HeroUpdate } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function updateHero(
  supabase: AnySupabase,
  id: string,
  payload: HeroUpdate,
): Promise<Hero> {
  const { data, error } = await supabase
    .from("hero")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
