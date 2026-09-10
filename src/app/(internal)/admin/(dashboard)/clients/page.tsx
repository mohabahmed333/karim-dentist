import { ClientsEditor } from "@/features/admin/components/ClientsEditor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("clients")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <ClientsEditor items={data ?? []} />;
}
