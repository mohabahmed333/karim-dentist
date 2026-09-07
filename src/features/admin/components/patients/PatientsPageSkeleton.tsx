import { Skeleton } from "@/components/ui/skeleton";

function Block({ className }: { className?: string }) {
  return (
    <Skeleton
      className={`bg-[var(--admin-hover,#eeeff1)] ${className ?? ""}`}
    />
  );
}

export function PatientsPageSkeleton() {
  return (
    <div className="space-y-4" aria-busy aria-label="Loading patients">
      <Block className="h-9 w-full" />
      <div className="flex flex-wrap gap-2">
        <Block className="h-7 w-28 rounded-full" />
        <Block className="h-7 w-24 rounded-full" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-[var(--admin-border)]">
        <div className="space-y-0">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-[var(--admin-border)] px-4 py-3 last:border-0"
            >
              <Block className="h-4 w-36" />
              <Block className="h-4 w-28" />
              <Block className="h-4 w-12" />
              <Block className="h-4 w-24" />
              <Block className="h-4 w-24" />
              <Block className="h-8 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
