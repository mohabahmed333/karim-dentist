import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { PatientDirectory } from "@/features/admin/components/patients/PatientDirectory";
import { PatientsPageSkeleton } from "@/features/admin/components/patients/PatientsPageSkeleton";
import { reservationFiltersCache } from "@/features/admin/lib/reservationFilters";
import { parseServiceFilter } from "@/features/admin/lib/serviceFilter";
import { groupReservationsByPatient } from "@/services/reservations/patientHistory";
import { pagePatientGroups } from "@/services/reservations/patientDirectoryPage";
import { listReservationsServer } from "@/services/reservations/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPatientsPage({ searchParams }: PageProps) {
  const raw = await reservationFiltersCache.parse(searchParams);
  const cohort = raw.cohort;
  const dateActive = Boolean(raw.from && raw.to);
  const q = (raw.q ?? "").trim();

  const supabase = await createClient();
  const [reservations, services] = await Promise.all([
    // Full visit history — no date clamp; status/service/q at SQL.
    listReservationsServer(supabase, {
      status: raw.status,
      serviceIds: parseServiceFilter(raw.service),
      q,
    }).catch(() => []),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  const page = pagePatientGroups(groupReservationsByPatient(reservations), {
    cohort,
    q: "",
    from: dateActive ? raw.from : null,
    to: dateActive ? raw.to : null,
    sort: raw.sort,
    dir: raw.dir,
    page: raw.page,
    limit: raw.limit,
  });

  return (
    <Suspense fallback={<PatientsPageSkeleton />}>
      <PatientDirectory
        groups={page.items}
        total={page.total}
        services={services.data ?? []}
      />
    </Suspense>
  );
}
