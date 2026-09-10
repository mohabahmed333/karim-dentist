import { KnowledgeEditor } from "@/features/admin/components/KnowledgeEditor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminKnowledgePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinic_knowledge")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <KnowledgeEditor items={data ?? []} />;
}
