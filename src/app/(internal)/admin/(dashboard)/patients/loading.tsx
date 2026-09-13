import { PatientsPageSkeleton } from "@/features/admin/components/patients/PatientsPageSkeleton";

// Header mirrors LocalizedAdminPageHeader + AdminReservationFilters (title/description
// left, filter button right) — PatientDirectory renders the real one once it mounts,
// so PatientsPageSkeleton itself must stay `tableOnly` to avoid a second, differently
// shaped header stacking underneath this one.
export default function Loading() {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <div className="h-7 w-40 animate-pulse rounded-md bg-[var(--admin-hover)]" />
          <div className="h-4 w-64 animate-pulse rounded-md bg-[var(--admin-hover)]" />
        </div>
        <div className="h-9 w-28 shrink-0 animate-pulse rounded-md bg-[var(--admin-hover)]" />
      </div>
      <PatientsPageSkeleton tableOnly />
    </div>
  );
}
