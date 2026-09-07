import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type CaseStudy = Tables<"case_studies">;
export type CaseStudyInsert = TablesInsert<"case_studies">;
export type CaseStudyUpdate = TablesUpdate<"case_studies">;
