import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";

export type Hero = Tables<"hero">;
export type HeroUpdate = TablesUpdate<"hero">;
