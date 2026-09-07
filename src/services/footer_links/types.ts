import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type FooterLink = Tables<"footer_links">;
export type FooterLinkInsert = TablesInsert<"footer_links">;
export type FooterLinkUpdate = TablesUpdate<"footer_links">;

export type FooterColumnKey = FooterLink["column_key"];
