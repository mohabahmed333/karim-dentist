import { ExperienceEditor } from "@/features/admin/components/ExperienceEditor";
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminExperiencePage() {
  await requirePagePermission("experience.view");
  const supabase = await createClient();
  const { data } = await supabase
    .from("experience_entries")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <ExperienceEditor items={data ?? []} />;
}
