import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type SocialLink = Tables<"social_links">;
export type SocialLinkInsert = TablesInsert<"social_links">;
export type SocialLinkUpdate = TablesUpdate<"social_links">;

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createSocialLink(
  supabase: AnySupabase,
  payload: SocialLinkInsert,
): Promise<SocialLink> {
  const { data, error } = await supabase
    .from("social_links")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSocialLink(
  supabase: AnySupabase,
  id: string,
  payload: SocialLinkUpdate,
): Promise<SocialLink> {
  const { data, error } = await supabase
    .from("social_links")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteSocialLink(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("social_links")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
