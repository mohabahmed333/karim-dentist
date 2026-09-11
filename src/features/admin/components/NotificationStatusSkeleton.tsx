import { AdminSkeleton as Skeleton } from "./AdminSkeleton";

const frame = "overflow-hidden rounded-lg border border-[var(--admin-border,#e5e7eb)] bg-[var(--admin-panel,#fff)]";
const row = "flex items-center gap-2.5 border-b border-[var(--admin-border,#e5e7eb)] px-3 py-2.5 last:border-b-0";

/** Same shape as "Fix these first", so nothing jumps when the real list arrives. */
export function RootCausesSkeleton() {
  const widths = ["w-44", "w-36", "w-52", "w-32"];
  return (
    <section aria-busy="true" className="space-y-2">
      <span className="sr-only">Checking what needs fixing…</span>
      <div className="flex items-baseline justify-between gap-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className={frame}>
        {widths.map((w) => (
          <div key={w} className={row}>
            <Skeleton className="size-2 rounded-full" />
            <Skeleton className={`h-3.5 ${w}`} />
            <Skeleton className="ml-auto h-3 w-14" />
            <Skeleton className="size-5 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Same shape as the one-line feature rows. */
export function FeaturesSkeleton() {
  const widths = ["w-40", "w-36", "w-44", "w-32", "w-48", "w-36"];
  return (
    <section aria-busy="true" className="space-y-2">
      <span className="sr-only">Checking each feature…</span>
      <div className="flex items-baseline justify-between gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className={frame}>
        {widths.map((w, i) => (
          <div key={`${w}-${i}`} className={row}>
            <Skeleton className={`h-3.5 ${w}`} />
            <Skeleton className="ml-auto h-3 w-8" />
            <Skeleton className="h-5 w-[84px] rounded-full" />
            <Skeleton className="size-5 rounded-full" />
          </div>
        ))}
      </div>
    </section>
  );
}

const label = "h-3 w-16";

/** The controls column: mode switch, schedule rows, marketing switch, Save. */
export function NotificationControlsSkeleton() {
  return (
    <div aria-hidden className="space-y-5">
      <div className="space-y-1.5">
        <Skeleton className={label} />
        <Skeleton className="h-10 w-full rounded-lg" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="space-y-2.5">
        <Skeleton className={label} />
        {["w-24", "w-40", "w-36"].map((w) => (
          <div key={w} className="flex items-center justify-between gap-2">
            <Skeleton className={`h-3.5 ${w}`} />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
        <Skeleton className="h-3 w-3/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className={label} />
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-52" />
          </div>
          <Skeleton className="size-4 rounded" />
        </div>
      </div>
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  );
}

/** The whole tab while its settings load, laid out exactly like the real one. */
export function NotificationSettingsSkeleton() {
  return (
    <div aria-busy="true" className="space-y-5">
      <span className="sr-only">Loading patient notification settings…</span>
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-3 w-80" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <NotificationControlsSkeleton />
        <div className="min-w-0 space-y-5">
          <RootCausesSkeleton />
          <FeaturesSkeleton />
        </div>
      </div>
    </div>
  );
}
