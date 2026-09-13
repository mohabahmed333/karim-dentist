import { AdminSkeleton as Block } from "@/features/admin/components/AdminSkeleton";

// Matches UsageAiModels: card header, a few numbered model rows (name + status
// pill, then a requests/tokens line), a total row below a divider.
function AiModelsSection() {
  return (
    <div className="admin-card rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <div className="flex items-baseline justify-between gap-2">
        <Block className="h-4 w-28" />
        <Block className="h-3 w-40" />
      </div>
      <div className="mt-4 space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Block className="h-3.5 w-48" />
              <Block className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Block className="h-3 w-24" />
              <Block className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--admin-border)] pt-3">
        <Block className="h-3.5 w-20" />
        <Block className="h-3.5 w-28" />
      </div>
    </div>
  );
}

// Matches UsageApiCounts: card header, 5 label/value rows (auth/rest/storage/realtime/total).
function ApiCountsSection() {
  return (
    <div className="admin-card rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)] p-4">
      <Block className="h-4 w-32" />
      <Block className="mt-1.5 h-3 w-24" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <Block className="h-3.5 w-24" />
            <Block className="h-3.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function UsagePageSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading usage">
      <div className="space-y-2">
        <Block className="h-7 w-40" />
        <Block className="h-4 w-72" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Block className="h-48 rounded-xl" />
        <Block className="h-48 rounded-xl" />
        <Block className="h-48 rounded-xl" />
        <Block className="h-48 rounded-xl" />
        <Block className="h-48 rounded-xl" />
        <Block className="h-48 rounded-xl" />
        <Block className="h-48 rounded-xl" />
        <Block className="h-48 rounded-xl" />
      </div>
      <AiModelsSection />
      <ApiCountsSection />
    </div>
  );
}
