import { Skeleton } from "@/components/ui/skeleton";

function Block({ className }: { className?: string }) {
  return (
    <Skeleton
      className={`bg-[var(--admin-hover,#eeeff1)] ${className ?? ""}`}
    />
  );
}

export function ReservationsPageSkeleton() {
  return (
    <div className="space-y-5" aria-busy aria-label="Loading reservations">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Block className="h-9 w-56" />
        <Block className="h-9 w-40" />
      </div>
      <Block className="h-9 w-full" />
      <div className="flex flex-wrap gap-2">
        <Block className="h-7 w-28 rounded-full" />
        <Block className="h-7 w-24 rounded-full" />
        <Block className="h-7 w-32 rounded-full" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <Block className="min-h-[22rem] rounded-xl" />
        <Block className="min-h-[22rem] rounded-xl" />
      </div>
      <Block className="h-64 rounded-xl" />
    </div>
  );
}
