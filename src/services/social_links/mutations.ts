import { createClient } from "@/lib/supabase/client";
import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type SocialLink = Tables<"social_links">;
export type SocialLinkInsert = TablesInsert<"social_links">;
export type SocialLinkUpdate = TablesUpdate<"social_links">;

export async function createSocialLink(
  payload: SocialLinkInsert,
): Promise<SocialLink> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_links")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSocialLink(
  id: string,
  payload: SocialLinkUpdate,
): Promise<SocialLink> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("social_links")
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function softDeleteSocialLink(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("social_links")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
