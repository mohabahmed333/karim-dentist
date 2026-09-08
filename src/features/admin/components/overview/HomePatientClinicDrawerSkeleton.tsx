import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Block({ className }: { className?: string }) {
  return (
    <Skeleton
      className={`bg-[var(--admin-hover,#eeeff1)] ${className ?? ""}`}
    />
  );
}

function Card({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}

/** Matches stacked PatientEhrView inside the home Clinical drawer. */
export function HomePatientClinicDrawerSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 flex-1 flex-col"
      aria-busy
      aria-label="Loading patient clinical"
    >
      <div className="flex h-full min-h-0 flex-col gap-3 p-3 sm:p-4">
        <Card className="flex min-h-0 flex-[1.1] flex-col overflow-hidden p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <Block className="h-4 w-28" />
            <Block className="h-8 w-20 rounded-full" />
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3">
            <Block className="h-full min-h-[8rem] rounded-xl" />
            <Block className="h-full min-h-[8rem] rounded-xl" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Block key={i} className="size-7 rounded-md" />
            ))}
          </div>
        </Card>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
          <Card className="space-y-3 overflow-hidden p-3">
            <Block className="h-4 w-24" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-[var(--admin-border)] p-2.5"
              >
                <Block className="size-8 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Block className="h-3.5 w-3/4" />
                  <Block className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </Card>
          <Card className="space-y-3 overflow-hidden p-3">
            <Block className="h-4 w-32" />
            <Block className="h-24 w-full rounded-xl" />
            <Block className="h-3 w-full" />
            <Block className="h-3 w-5/6" />
            <Block className="h-3 w-2/3" />
            <div className="flex gap-2 pt-1">
              <Block className="h-16 flex-1 rounded-lg" />
              <Block className="h-16 flex-1 rounded-lg" />
              <Block className="h-16 flex-1 rounded-lg" />
            </div>
          </Card>
        </div>
      </div>

      <div className="shrink-0 border-t border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2.5">
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-14 w-36 shrink-0 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
