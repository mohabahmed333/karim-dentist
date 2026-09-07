import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type FeaturedProject = Tables<"featured_projects">;
export type FeaturedInsert = TablesInsert<"featured_projects">;
export type FeaturedUpdate = TablesUpdate<"featured_projects">;
