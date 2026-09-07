import { createClient } from "@/lib/supabase/client";
import type { About, AboutUpdate } from "./types";

export async function updateAbout(
  id: string,
  payload: AboutUpdate,
): Promise<About> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("about")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createAbout(payload: AboutUpdate): Promise<About> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("about")
    .insert({
      drop_cap: payload.drop_cap ?? "",
      drop_cap_logo_url: payload.drop_cap_logo_url ?? null,
      body: payload.body ?? "",
      image_url: payload.image_url ?? null,
      media_type: payload.media_type ?? "image",
      copy_image_url: payload.copy_image_url ?? null,
      copy_media_type: payload.copy_media_type ?? "image",
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function upsertAbout(
  existing: About | null,
  payload: AboutUpdate,
): Promise<About> {
  if (existing) return updateAbout(existing.id, payload);
  return createAbout(payload);
}
