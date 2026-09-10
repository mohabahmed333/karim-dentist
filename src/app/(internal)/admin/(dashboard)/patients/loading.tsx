import { PatientsPageSkeleton } from "@/features/admin/components/patients/PatientsPageSkeleton";

export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="h-7 w-40 animate-pulse rounded-md bg-[var(--admin-hover)]" />
        <div className="h-4 w-64 animate-pulse rounded-md bg-[var(--admin-hover)]" />
      </div>
      <PatientsPageSkeleton />
    </div>
  );
}
