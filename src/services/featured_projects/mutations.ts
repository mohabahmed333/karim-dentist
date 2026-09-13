import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { FeaturedInsert, FeaturedProject, FeaturedUpdate } from "./types";
import { resolveFeaturedUniqueSlug } from "./queries";
import { isBlankSlug } from "@/services/case_studies/slug";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createFeatured(
  supabase: AnySupabase,
  payload: FeaturedInsert,
): Promise<FeaturedProject> {
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
  supabase: AnySupabase,
  id: string,
  payload: FeaturedUpdate,
): Promise<FeaturedProject> {
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

export async function softDeleteFeatured(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("featured_projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
