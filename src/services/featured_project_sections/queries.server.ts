import { createPublicClient } from "@/lib/supabase/public";
import { parseSectionContent, type SectionType } from "@/services/case_study_sections";
import type { FeaturedProjectSection, ParsedFeaturedSection } from "./types";

function parseRow(row: FeaturedProjectSection): ParsedFeaturedSection {
  const type = row.type as SectionType;
  return {
    ...row,
    type,
    content: parseSectionContent(type, row.content),
  };
}

export async function listSectionsForFeaturedProjectServer(
  featuredProjectId: string,
  publishedOnly = false,
): Promise<ParsedFeaturedSection[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("featured_project_sections")
    .select("*")
    .eq("featured_project_id", featuredProjectId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (publishedOnly) {
    query = query.eq("is_visible", true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(parseRow);
}
