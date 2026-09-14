import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";

/**
 * Mirrors PatientWorkspaceView.tsx's actual DOM (same shell/grid classes,
 * same header-chip position, same chart-region cap of h-[min(52vh,420px)])
 * so the loading frame doesn't jump when the real layout mounts.
 */
export function PatientWorkspaceSkeleton() {
  return (
    <div
      aria-busy
      aria-label="Loading patient workspace"
      className="relative -m-4 flex h-[calc(100dvh-4.5rem)] min-h-0 flex-col bg-[var(--admin-canvas)] md:-m-6"
    >
      <div className="pointer-events-none absolute top-4 start-4 z-40 min-w-0 max-w-[min(18rem,50vw)] space-y-1.5 md:top-5 md:start-6">
        <AdminSkeleton className="h-4 w-32 rounded" />
        <AdminSkeleton className="h-2.5 w-24 rounded" />
        <AdminSkeleton className="h-2.5 w-14 rounded" />
      </div>

      <div className="relative grid min-h-0 flex-1 items-stretch lg:grid-cols-2">
        <div className="flex min-h-0 flex-col px-4 py-4 md:px-6 md:py-5 lg:pe-4">
          <div className="relative flex min-h-0 flex-1 items-center justify-center">
            <AdminSkeleton className="h-[min(52vh,420px)] w-full rounded-xl" />
          </div>
        </div>
        <div className="flex min-h-0 flex-col items-center justify-center border-t border-[#e5e7eb] lg:border-t-0">
          <AdminSkeleton className="h-3 w-48 rounded" />
        </div>
      </div>

      <div className="border-t border-[#e5e7eb] px-4 py-4 md:px-6 md:py-5">
        <AdminSkeleton className="h-3 w-40 rounded" />
      </div>
    </div>
  );
}
