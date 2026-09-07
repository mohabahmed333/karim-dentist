import type { Tables, TablesUpdate } from "@/lib/supabase/database.types";

export type SiteSettings = Tables<"site_settings">;
export type SiteSettingsUpdate = TablesUpdate<"site_settings">;
