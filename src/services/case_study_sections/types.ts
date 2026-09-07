import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import type { SectionContent, SectionType } from "./schemas";

export type CaseStudySection = Tables<"case_study_sections">;
export type CaseStudySectionInsert = TablesInsert<"case_study_sections">;
export type CaseStudySectionUpdate = TablesUpdate<"case_study_sections">;

export type ParsedCaseStudySection = Omit<CaseStudySection, "content"> & {
  content: SectionContent;
  type: SectionType;
};
