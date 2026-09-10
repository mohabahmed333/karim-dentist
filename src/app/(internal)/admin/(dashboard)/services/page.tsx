import { ServicesEditor } from "@/features/admin/components/ServicesEditor";
import { SolutionPanelsEditor } from "@/features/admin/components/SolutionPanelsEditor";
import { createClient } from "@/lib/supabase/server";
import { dentalSolutionsFallback } from "@/services/dental/fallback";
import type { SolutionPanel } from "@/services/dental/types";

export const dynamic = "force-dynamic";

export default async function AdminServicesPage() {
  const supabase = await createClient();
  const [services, panels] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    supabase.from("solution_panels").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="space-y-10">
      <SolutionPanelsEditor
        panels={(panels.data as SolutionPanel[] | null) ?? dentalSolutionsFallback}
      />
      <ServicesEditor items={services.data ?? []} />
    </div>
  );
}
