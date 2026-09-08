import { createClient } from "@/lib/supabase/server";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import {
  buildAttentionItems,
  buildDashboardKpis,
  DASHBOARD_LIST_LIMIT,
  firstNameFromEmail,
} from "@/features/admin/lib/dashboardModel";
import { expandCoverageThroughAfterTomorrow } from "@/features/admin/lib/dayScheduleModel";
import {
  defaultOverviewFromTo,
  reservationFiltersCache,
  resolveReservationFilters,
} from "@/features/admin/lib/reservationFilters";
import { listReservationsServer } from "@/services/reservations/queries";
import { buildReservationStats } from "@/services/reservations/stats";
import { listConversations } from "@/services/whatsapp/queries";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
} from "@/features/admin/lib/dashboardLayout";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOverviewPage({ searchParams }: PageProps) {
  const raw = await reservationFiltersCache.parse(searchParams);
  const filters = resolveReservationFilters(raw, defaultOverviewFromTo());
  // Even when the date filter is "Today", load through day+2 so Day Schedule
  // and upcoming lists can show tomorrow / day after without a blank next click.
  const coverage = expandCoverageThroughAfterTomorrow(filters.from, filters.to);
  const listFilters = { ...filters, from: coverage.from, to: coverage.to };

  const supabase = await createClient();
  const [
    { data: auth },
    reservations,
    servicesRes,
    conversations,
    settingsRes,
  ] = await Promise.all([
    supabase.auth.getUser(),
    listReservationsServer(supabase, listFilters).catch(() => []),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    listConversations(supabase, {
      status: "open",
      sort: "newest",
      limit: DASHBOARD_LIST_LIMIT,
    }).catch(() => []),
    supabase.from("site_settings").select("*").limit(1).maybeSingle(),
  ]);

  const email = auth.user?.email ?? null;
  const displayName = firstNameFromEmail(email);
  const publishedCount = servicesRes.data?.length ?? 0;
  const stats = buildReservationStats(reservations);
  const settings = settingsRes.data ?? null;
  const initialLayout = normalizeDashboardLayout(
    settings?.dashboard_layout ?? DEFAULT_DASHBOARD_LAYOUT,
  );

  return (
    <ClinicDashboard
      email={email}
      displayName={displayName}
      reservations={reservations}
      coverageFrom={coverage.from}
      coverageTo={coverage.to}
      services={servicesRes.data ?? []}
      attention={buildAttentionItems(reservations)}
      kpis={buildDashboardKpis(reservations, publishedCount)}
      stats={stats}
      conversations={conversations}
      settings={settings}
      initialLayout={initialLayout}
    />
  );
}
