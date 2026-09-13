import { KnowledgeEditor } from "@/features/admin/components/KnowledgeEditor";
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminKnowledgePage() {
  await requirePagePermission("knowledge.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("clinic_knowledge")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <KnowledgeEditor items={data ?? []} />;
}
