import { Skeleton } from "@/components/ui/skeleton";

function Block({ className }: { className?: string }) {
  return (
    <Skeleton
      className={`bg-[var(--admin-hover,#eeeff1)] ${className ?? ""}`}
    />
  );
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6" aria-busy aria-label="Loading dashboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
        <div className="space-y-2">
          <Block className="h-7 w-48" />
          <Block className="h-4 w-64" />
        </div>
        <Block className="h-9 w-full max-w-xl" />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Block className="h-24 rounded-xl" />
        <Block className="h-24 rounded-xl" />
        <Block className="h-24 rounded-xl" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        <Block className="h-28 w-[15.5rem] shrink-0 rounded-xl" />
        <Block className="h-28 w-[15.5rem] shrink-0 rounded-xl" />
        <Block className="h-28 w-[15.5rem] shrink-0 rounded-xl" />
        <Block className="h-28 w-[15.5rem] shrink-0 rounded-xl" />
      </div>
      <Block className="h-72 rounded-xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Block className="h-80 rounded-xl" />
        <Block className="h-80 rounded-xl" />
        <Block className="h-80 rounded-xl" />
        <Block className="h-80 rounded-xl" />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Block className="h-64 rounded-xl" />
        <Block className="h-64 rounded-xl" />
        <Block className="h-64 rounded-xl" />
        <Block className="h-64 rounded-xl" />
      </div>
      <Block className="h-48 rounded-xl" />
    </div>
  );
}
