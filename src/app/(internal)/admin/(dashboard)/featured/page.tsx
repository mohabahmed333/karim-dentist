import { FeaturedEditor } from "@/features/admin/components/FeaturedEditor";
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminFeaturedPage() {
  await requirePagePermission("featured.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("featured_projects")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <FeaturedEditor items={data ?? []} />;
}
