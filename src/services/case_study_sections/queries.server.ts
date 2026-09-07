import { createPublicClient } from "@/lib/supabase/public";
import { parseSectionContent, type SectionType } from "./schemas";
import type { CaseStudySection, ParsedCaseStudySection } from "./types";

function parseRow(row: CaseStudySection): ParsedCaseStudySection {
  const type = row.type as SectionType;
  return {
    ...row,
    type,
    content: parseSectionContent(type, row.content),
  };
}

export async function listSectionsForCaseStudyServer(
  caseStudyId: string,
  publishedOnly = false,
): Promise<ParsedCaseStudySection[]> {
  const supabase = createPublicClient();
  let query = supabase
    .from("case_study_sections")
    .select("*")
    .eq("case_study_id", caseStudyId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (publishedOnly) {
    query = query.eq("is_visible", true);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(parseRow);
}
