import { createPublicClient } from "@/lib/supabase/public";
import type { CaseStudy } from "./types";

export async function getCaseStudyBySlug(
  slug: string,
): Promise<CaseStudy | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("slug", slug)
    .is("deleted_at", null)
    .eq("is_published", true)
    .maybeSingle();
  if (error) throw error;
  return data;
}
