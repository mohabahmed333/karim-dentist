import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ReservationsPageView } from "@/features/admin/components/reservations/ReservationsPageView";
import { ReservationsPageSkeleton } from "@/features/admin/components/reservations/ReservationsPageSkeleton";
import {
  reservationFiltersCache,
  resolveReservationFilters,
  defaultMonthFromTo,
} from "@/features/admin/lib/reservationFilters";
import { listReservationsServer } from "@/services/reservations/queries";

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
  const [reservations, services] = await Promise.all([
    listReservationsServer(supabase, filters),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  return (
    <Suspense fallback={<ReservationsPageSkeleton />}>
      <ReservationsPageView
        reservations={reservations}
        services={services.data ?? []}
      />
    </Suspense>
  );
}
