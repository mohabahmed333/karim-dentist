import { FaqsEditor } from "@/features/admin/components/FaqsEditor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminFaqPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("faqs")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <FaqsEditor items={data ?? []} />;
}
