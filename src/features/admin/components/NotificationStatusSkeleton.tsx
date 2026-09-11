import { Skeleton as KitSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * The kit's skeleton fills with `bg-muted`, which is white in the admin theme,
 * so its bars do not show. This one takes its fill from the admin palette.
 */
function Skeleton({ className }: { className?: string }) {
  return <KitSkeleton className={cn("bg-[var(--admin-border,#e6e6e6)]", className)} />;
}

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
