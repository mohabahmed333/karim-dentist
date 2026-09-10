import type {
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type Faq = Tables<"faqs">;
export type FaqInsert = TablesInsert<"faqs">;
export type FaqUpdate = TablesUpdate<"faqs">;
