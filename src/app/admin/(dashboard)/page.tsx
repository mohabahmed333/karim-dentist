import { createClient } from "@/lib/supabase/server";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import {
  buildAttentionItems,
  buildDashboardKpis,
  firstNameFromEmail,
} from "@/features/admin/lib/dashboardModel";
import {
  reservationFiltersCache,
  resolveReservationFilters,
} from "@/features/admin/lib/reservationFilters";
import { listReservationsServer } from "@/services/reservations/queries";
import { buildReservationStats } from "@/services/reservations/stats";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOverviewPage({ searchParams }: PageProps) {
  const raw = await reservationFiltersCache.parse(searchParams);
  const filters = resolveReservationFilters(raw);

  const supabase = await createClient();
  const [{ data: auth }, reservations, servicesRes] = await Promise.all([
    supabase.auth.getUser(),
    listReservationsServer(supabase, filters).catch(() => []),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
  ]);

  const email = auth.user?.email ?? null;
  const displayName = firstNameFromEmail(email);
  const publishedCount = servicesRes.data?.length ?? 0;
  const stats = buildReservationStats(reservations);

  return (
    <ClinicDashboard
      email={email}
      displayName={displayName}
      reservations={reservations}
      services={servicesRes.data ?? []}
      attention={buildAttentionItems(reservations)}
      kpis={buildDashboardKpis(reservations, publishedCount)}
      stats={stats}
    />
  );
}
