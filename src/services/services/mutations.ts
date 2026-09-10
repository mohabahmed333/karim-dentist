import { createClient } from "@/lib/supabase/client";
import type { Service, ServiceInsert, ServiceUpdate } from "./types";
import { resolveUniqueSlug } from "./queries";
import { isBlankSlug } from "./slug";

export async function createService(payload: ServiceInsert): Promise<Service> {
  const supabase = createClient();
  const slug = isBlankSlug(payload.slug)
    ? await resolveUniqueSlug(payload.title)
    : payload.slug;
  const { data, error } = await supabase
    .from("services")
    .insert({ ...payload, slug })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateService(
  id: string,
  payload: ServiceUpdate,
): Promise<Service> {
  const supabase = createClient();
  const next: ServiceUpdate = {
    ...payload,
    updated_at: new Date().toISOString(),
  };
  if (isBlankSlug(payload.slug)) {
    const { data: existing, error: readError } = await supabase
      .from("services")
      .select("slug, title")
      .eq("id", id)
      .single();
    if (readError) throw readError;
    next.slug = isBlankSlug(existing.slug)
      ? await resolveUniqueSlug(payload.title ?? existing.title, id)
      : existing.slug;
  }
  const { data, error } = await supabase
    .from("services")
    .update(next)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteService(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("services")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
