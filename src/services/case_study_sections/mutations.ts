import { createClient } from "@/lib/supabase/client";
import {
  defaultContentForType,
  parseSectionContent,
  type SectionType,
} from "./schemas";
import type {
  CaseStudySection,
  CaseStudySectionInsert,
  CaseStudySectionUpdate,
} from "./types";

export async function createSection(
  payload: CaseStudySectionInsert,
): Promise<CaseStudySection> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("case_study_sections")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createSectionOfType(
  caseStudyId: string,
  type: SectionType,
  sortOrder: number,
  options?: {
    layoutVariant?: string;
    content?: ReturnType<typeof defaultContentForType>;
  },
): Promise<CaseStudySection> {
  const content = options?.content ?? defaultContentForType(type);
  return createSection({
    case_study_id: caseStudyId,
    type,
    layout_variant: options?.layoutVariant ?? "default",
    content,
    sort_order: sortOrder,
    is_visible: true,
  });
}

export async function updateSection(
  id: string,
  payload: CaseStudySectionUpdate,
): Promise<CaseStudySection> {
  const supabase = createClient();
  const next = { ...payload, updated_at: new Date().toISOString() };
  if (payload.content !== undefined && payload.type) {
    next.content = parseSectionContent(
      payload.type as SectionType,
      payload.content,
    );
  } else if (payload.content !== undefined) {
    const { data: existing, error: readError } = await supabase
      .from("case_study_sections")
      .select("type")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    next.content = parseSectionContent(
      existing.type as SectionType,
      payload.content,
    );
  }
  const { data, error } = await supabase
    .from("case_study_sections")
    .update(next)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteSection(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("case_study_sections")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function reorderSections(
  caseStudyId: string,
  orderedIds: string[],
): Promise<void> {
  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("case_study_sections")
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("case_study_id", caseStudyId),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function duplicateSection(
  section: CaseStudySection,
  sortOrder: number,
): Promise<CaseStudySection> {
  return createSection({
    case_study_id: section.case_study_id,
    type: section.type,
    layout_variant: section.layout_variant,
    content: section.content,
    sort_order: sortOrder,
    is_visible: section.is_visible,
  });
}
