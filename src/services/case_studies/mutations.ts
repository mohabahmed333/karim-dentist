import { createClient } from "@/lib/supabase/client";
import type { CaseStudy, CaseStudyInsert, CaseStudyUpdate } from "./types";
import { resolveUniqueSlug } from "./queries";
import { isBlankSlug } from "./slug";

export async function createCaseStudy(
  payload: CaseStudyInsert,
): Promise<CaseStudy> {
  const supabase = createClient();
  const slug = isBlankSlug(payload.slug)
    ? await resolveUniqueSlug(payload.title)
    : payload.slug;
  const { data, error } = await supabase
    .from("case_studies")
    .insert({ ...payload, slug })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCaseStudy(
  id: string,
  payload: CaseStudyUpdate,
): Promise<CaseStudy> {
  const supabase = createClient();
  const next: CaseStudyUpdate = {
    ...payload,
    updated_at: new Date().toISOString(),
  };
  if (isBlankSlug(payload.slug)) {
    const { data: existing, error: readError } = await supabase
      .from("case_studies")
      .select("slug, title")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    next.slug = isBlankSlug(existing.slug)
      ? await resolveUniqueSlug(payload.title ?? existing.title, id)
      : existing.slug;
  }
  const { data, error } = await supabase
    .from("case_studies")
    .update(next)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteCaseStudy(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("case_studies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
