import { createClient } from "@/lib/supabase/client";
import {
  parseSectionContent,
  type SectionType,
} from "./schemas";
import type { CaseStudySection, ParsedCaseStudySection } from "./types";

function parseRow(row: CaseStudySection): ParsedCaseStudySection {
  const type = row.type as SectionType;
  return {
    ...row,
    type,
    content: parseSectionContent(type, row.content),
  };
}

export async function listSectionsForCaseStudy(
  caseStudyId: string,
): Promise<ParsedCaseStudySection[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("case_study_sections")
    .select("*")
    .eq("case_study_id", caseStudyId)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(parseRow);
}

export async function listAllSectionsGrouped(): Promise<
  Record<string, ParsedCaseStudySection[]>
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("case_study_sections")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  const grouped: Record<string, ParsedCaseStudySection[]> = {};
  for (const row of data ?? []) {
    const parsed = parseRow(row);
    const list = grouped[parsed.case_study_id] ?? [];
    list.push(parsed);
    grouped[parsed.case_study_id] = list;
  }
  return grouped;
}
