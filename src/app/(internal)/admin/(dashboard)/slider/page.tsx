import { SliderEditor } from "@/features/admin/components/SliderEditor";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminSliderPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("featured_projects")
    .select("*")
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });

  return <SliderEditor items={data ?? []} />;
}
