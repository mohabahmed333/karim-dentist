import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type ExperienceEntry = Tables<"experience_entries">;
export type ExperienceInsert = TablesInsert<"experience_entries">;
export type ExperienceUpdate = TablesUpdate<"experience_entries">;
