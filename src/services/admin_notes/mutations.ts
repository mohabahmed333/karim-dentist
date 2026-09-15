import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { AdminNote } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function createAdminNote(
  supabase: AnySupabase,
  input: { content: string; createdBy: string | null },
): Promise<AdminNote> {
  const { data, error } = await supabase
    .from("admin_notes")
    .insert({ content: input.content, created_by: input.createdBy })
    .select("id, content, color, created_by, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function updateAdminNoteContent(
  supabase: AnySupabase,
  id: string,
  content: string,
): Promise<AdminNote> {
  const { data, error } = await supabase
    .from("admin_notes")
    .update({ content, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id, content, color, created_by, created_at, updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function dismissAdminNote(
  supabase: AnySupabase,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("admin_notes")
    .update({ dismissed_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
