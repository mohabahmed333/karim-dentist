import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ReservationsPageView } from "@/features/admin/components/reservations/ReservationsPageView";
import { ReservationsPageSkeleton } from "@/features/admin/components/reservations/ReservationsPageSkeleton";
import {
  reservationFiltersCache,
  resolveReservationFilters,
  defaultMonthFromTo,
} from "@/features/admin/lib/reservationFilters";
import {
  listReservationsPageServer,
  listReservationsServer,
} from "@/services/reservations/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminReservationsPage({
  searchParams,
}: PageProps) {
  const raw = await reservationFiltersCache.parse(searchParams);
  const filters = resolveReservationFilters(raw, defaultMonthFromTo());

  const supabase = await createClient();
  // Calendar / today rail: month (+ status/service), ignore search + pagination.
  const calendarFilters = {
    from: filters.from,
    to: filters.to,
    status: filters.status,
    serviceIds: filters.serviceIds,
    q: "",
    sort: "starts_at" as const,
    dir: "asc" as const,
    page: 1,
    limit: 8,
  };

  const [calendarReservations, tablePage, services] = await Promise.all([
    listReservationsServer(supabase, calendarFilters),
    listReservationsPageServer(supabase, filters),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <Suspense fallback={<ReservationsPageSkeleton />}>
      <ReservationsPageView
        reservations={calendarReservations}
        tableRows={tablePage.items}
        tableTotal={tablePage.total}
        services={services.data ?? []}
      />
    </Suspense>
  );
}
