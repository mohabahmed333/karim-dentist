import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { CaseStudy, CaseStudyInsert, CaseStudyUpdate } from "./types";
import { resolveUniqueSlug } from "./queries";
import { isBlankSlug } from "./slug";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createCaseStudy(
  supabase: AnySupabase,
  payload: CaseStudyInsert,
): Promise<CaseStudy> {
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
  supabase: AnySupabase,
  id: string,
  payload: CaseStudyUpdate,
): Promise<CaseStudy> {
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

export async function softDeleteCaseStudy(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("case_studies")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
