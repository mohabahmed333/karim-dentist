import { Skeleton } from "@/components/ui/skeleton";

function Block({ className }: { className?: string }) {
  return (
    <Skeleton className={`bg-[var(--admin-hover,#eeeff1)] ${className ?? ""}`} />
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
      <Block className="h-56 rounded-xl" />
    </div>
  );
}
