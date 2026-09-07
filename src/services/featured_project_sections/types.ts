import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";
import type { SectionContent, SectionType } from "@/services/case_study_sections";

export type FeaturedProjectSection = Tables<"featured_project_sections">;
export type FeaturedProjectSectionInsert =
  TablesInsert<"featured_project_sections">;
export type FeaturedProjectSectionUpdate =
  TablesUpdate<"featured_project_sections">;

export type ParsedFeaturedSection = Omit<FeaturedProjectSection, "content"> & {
  content: SectionContent;
  type: SectionType;
};
