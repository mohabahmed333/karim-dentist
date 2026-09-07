import { createClient } from "@/lib/supabase/client";
import type { FeaturedInsert, FeaturedProject, FeaturedUpdate } from "./types";
import { resolveFeaturedUniqueSlug } from "./queries";
import { isBlankSlug } from "@/services/case_studies/slug";

export async function createFeatured(
  payload: FeaturedInsert,
): Promise<FeaturedProject> {
  const supabase = createClient();
  const slug = isBlankSlug(payload.slug)
    ? await resolveFeaturedUniqueSlug(payload.title)
    : payload.slug;
  const { data, error } = await supabase
    .from("featured_projects")
    .insert({ ...payload, slug })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateFeatured(
  id: string,
  payload: FeaturedUpdate,
): Promise<FeaturedProject> {
  const supabase = createClient();
  const next: FeaturedUpdate = {
    ...payload,
    updated_at: new Date().toISOString(),
  };
  if (isBlankSlug(payload.slug)) {
    const { data: existing, error: readError } = await supabase
      .from("featured_projects")
      .select("slug, title")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    next.slug = isBlankSlug(existing.slug)
      ? await resolveFeaturedUniqueSlug(payload.title ?? existing.title, id)
      : existing.slug;
  }
  const { data, error } = await supabase
    .from("featured_projects")
    .update(next)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteFeatured(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("featured_projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
