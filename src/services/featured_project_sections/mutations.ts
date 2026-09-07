import { createClient } from "@/lib/supabase/client";
import {
  defaultContentForType,
  parseSectionContent,
  type SectionType,
} from "@/services/case_study_sections";
import type {
  FeaturedProjectSection,
  FeaturedProjectSectionInsert,
  FeaturedProjectSectionUpdate,
} from "./types";

export async function createFeaturedSection(
  payload: FeaturedProjectSectionInsert,
): Promise<FeaturedProjectSection> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("featured_project_sections")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createFeaturedSectionOfType(
  featuredProjectId: string,
  type: SectionType,
  sortOrder: number,
  options?: {
    layoutVariant?: string;
    content?: ReturnType<typeof defaultContentForType>;
  },
): Promise<FeaturedProjectSection> {
  const content = options?.content ?? defaultContentForType(type);
  return createFeaturedSection({
    featured_project_id: featuredProjectId,
    type,
    layout_variant: options?.layoutVariant ?? "default",
    content,
    sort_order: sortOrder,
    is_visible: true,
  });
}

export async function updateFeaturedSection(
  id: string,
  payload: FeaturedProjectSectionUpdate,
): Promise<FeaturedProjectSection> {
  const supabase = createClient();
  const next = { ...payload, updated_at: new Date().toISOString() };
  if (payload.content !== undefined && payload.type) {
    next.content = parseSectionContent(
      payload.type as SectionType,
      payload.content,
    );
  } else if (payload.content !== undefined) {
    const { data: existing, error: readError } = await supabase
      .from("featured_project_sections")
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
    .from("featured_project_sections")
    .update(next)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteFeaturedSection(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("featured_project_sections")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function reorderFeaturedSections(
  featuredProjectId: string,
  orderedIds: string[],
): Promise<void> {
  const supabase = createClient();
  const updates = orderedIds.map((id, index) =>
    supabase
      .from("featured_project_sections")
      .update({ sort_order: index, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("featured_project_id", featuredProjectId),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function duplicateFeaturedSection(
  section: FeaturedProjectSection,
  sortOrder: number,
): Promise<FeaturedProjectSection> {
  return createFeaturedSection({
    featured_project_id: section.featured_project_id,
    type: section.type,
    layout_variant: section.layout_variant,
    content: section.content,
    sort_order: sortOrder,
    is_visible: section.is_visible,
  });
}
