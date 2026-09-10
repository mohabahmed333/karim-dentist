import { FeaturedEditor } from "@/features/admin/components/FeaturedEditor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("featured_projects")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <FeaturedEditor items={data ?? []} />;
}
