import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

/** Upserts one page's layout by page_key, returning the persisted JSON. */
export async function upsertDashboardLayout(
  supabase: ServerSupabase,
  pageKey: string,
  layout: unknown,
): Promise<unknown> {
  const { data, error } = await supabase
    .from("dashboard_layouts")
    .upsert(
      {
        page_key: pageKey,
        layout: layout as Json,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "page_key" },
    )
    .select("layout")
    .single();
  if (error) throw error;
  return data.layout;
}
