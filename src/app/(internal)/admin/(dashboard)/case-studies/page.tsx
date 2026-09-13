import { CaseStudiesEditor } from "@/features/admin/components/CaseStudiesEditor";
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminCaseStudiesPage() {
  await requirePagePermission("case-studies.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("case_studies")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <CaseStudiesEditor items={data ?? []} />;
}
