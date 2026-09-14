import { AdminSkeleton as Block } from "@/features/admin/components/AdminSkeleton";
import { CollectionTableSkeleton } from "@/features/admin/components/CollectionTableSkeleton";

export function PatientsPageSkeleton({
  tableOnly = false,
}: {
  tableOnly?: boolean;
}) {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading patients">
      {tableOnly ? null : (
        <div className="mb-2 flex items-center justify-between gap-3">
          <Block className="h-8 w-40" />
          <Block className="h-9 w-56 rounded-md" />
        </div>
      )}
      <CollectionTableSkeleton columns={5} rows={8} rowActions />
    </div>
  );
}
