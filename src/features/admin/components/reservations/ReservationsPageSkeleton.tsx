import { Skeleton } from "@/components/ui/skeleton";
import { CALENDAR_GRID_DAYS } from "@/services/reservations/timeline";

function Block({ className }: { className?: string }) {
  return (
    <Skeleton
      className={`bg-[var(--admin-hover,#eeeff1)] ${className ?? ""}`}
    />
  );
}

type Props = {
  /** When false, omit month/filters row (page header already visible). */
  includeHeader?: boolean;
};

export function ReservationsPageSkeleton({ includeHeader = true }: Props) {
  return (
    <div className="space-y-5" aria-busy aria-label="Loading reservations">
      {includeHeader ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Block className="size-9 rounded-lg" />
            <Block className="h-7 w-40" />
            <Block className="size-9 rounded-lg" />
          </div>
          <Block className="h-9 w-28 rounded-lg" />
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.7fr)]">
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
          <div className="grid grid-cols-7 border-b border-[var(--admin-border)]">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="px-2 py-2.5">
                <Block className="mx-auto h-3 w-8" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 grid-rows-6">
            {Array.from({ length: CALENDAR_GRID_DAYS }).map((_, i) => (
              <div
                key={i}
                className="flex h-[6.5rem] flex-col gap-1.5 border-b border-e border-[var(--admin-border)] p-2"
              >
                <Block className="ms-auto h-3 w-4 rounded-sm" />
                <Block className="h-4 w-full rounded-sm" />
                <Block className="h-4 w-3/4 rounded-sm" />
              </div>
            ))}
          </div>
        </div>

        <aside className="flex min-h-[20rem] flex-col overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
          <div className="space-y-2 border-b border-[var(--admin-border)] px-4 py-3">
            <Block className="h-4 w-16" />
            <Block className="h-3 w-24" />
          </div>
          <div className="space-y-2 p-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="space-y-2 rounded-lg border border-[var(--admin-border)] p-3"
              >
                <Block className="h-3 w-14" />
                <Block className="h-4 w-28" />
                <Block className="h-3 w-20" />
              </div>
            ))}
          </div>
        </aside>
      </div>

      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-0.5">
          <Block className="h-4 w-32" />
          <Block className="h-3 w-16" />
        </div>
        <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--admin-border)] px-3 py-2.5">
            <Block className="h-9 w-44 rounded-md" />
            <Block className="ms-auto h-9 w-24 rounded-md" />
            <Block className="size-9 rounded-md" />
          </div>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 border-b border-[var(--admin-border)] px-4 py-3 last:border-0"
            >
              <Block className="h-4 w-28" />
              <Block className="h-4 w-24" />
              <Block className="h-4 w-28" />
              <Block className="h-4 w-32" />
              <Block className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
