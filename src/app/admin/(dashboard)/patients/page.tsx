import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { PatientDirectory } from "@/features/admin/components/patients/PatientDirectory";
import { PatientsPageSkeleton } from "@/features/admin/components/patients/PatientsPageSkeleton";
import {
  reservationFiltersCache,
  resolveReservationFilters,
} from "@/features/admin/lib/reservationFilters";
import {
  filterPatientGroups,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { listReservationsServer } from "@/services/reservations/queries";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminPatientsPage({ searchParams }: PageProps) {
  const raw = await reservationFiltersCache.parse(searchParams);
  const filters = resolveReservationFilters(raw);
  const cohort = raw.cohort;

  const supabase = await createClient();
  const [reservations, services] = await Promise.all([
    listReservationsServer(supabase, filters).catch(() => []),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
  ]);

  const groups = filterPatientGroups(
    groupReservationsByPatient(reservations),
    cohort,
    "",
  );

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.patients.title"
        descriptionKey="admin.patients.description"
      />
      <Suspense fallback={<PatientsPageSkeleton />}>
        <PatientDirectory
          groups={groups}
          services={services.data ?? []}
        />
      </Suspense>
    </>
  );
}
