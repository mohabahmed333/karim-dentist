import { AdminSkeleton as Skeleton } from "./AdminSkeleton";

/** A label above an input, the shape every field on the page takes. */
function Field({ label = "w-32" }: { label?: string }) {
  return (
    <div className="space-y-1.5">
      <Skeleton className={`h-3.5 ${label}`} />
      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}

/** A checkbox with a title and a line or two of explanation under it. */
function CheckRow({
  lines = 1,
  title = "w-64",
}: {
  lines?: number;
  title?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Skeleton className="mt-0.5 size-4 rounded" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className={`h-3.5 ${title}`} />
        {Array.from({ length: lines }, (_, i) => (
          <Skeleton
            key={i}
            className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * The deposit settings page while its values are on the way.
 *
 * Shaped like the real form — the same sections, the same two-column grid, the
 * same checkbox rows — so the page does not jump when the values land. The
 * title and save button are not here: they need nothing from the server, so
 * they render immediately and only the parts that are genuinely waiting are
 * drawn as skeletons.
 */
export function DepositSettingsSkeleton() {
  return (
    <div aria-busy="true" className="max-w-3xl space-y-6">
      <span className="sr-only">Loading deposit settings…</span>

      {/* The explanatory banner. */}
      <div className="space-y-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-hover)] px-3.5 py-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Deposit: the switch, then amount/hold and handle/wallet side by side. */}
      <div className="space-y-2.5">
        <Skeleton className="h-2.5 w-16" />
        <div className="space-y-4">
          <CheckRow title="w-56" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="w-40" />
            <Field label="w-44" />
            <Field label="w-28" />
            <Field label="w-28" />
          </div>
          <Field label="w-60" />
        </div>
      </div>

      {/* Confirmation: two switches, each with a paragraph of consequences. */}
      <div className="space-y-2.5">
        <Skeleton className="h-2.5 w-24" />
        <div className="space-y-4">
          <CheckRow lines={3} title="w-52" />
          <CheckRow lines={3} title="w-72" />
          <Skeleton className="h-11 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
