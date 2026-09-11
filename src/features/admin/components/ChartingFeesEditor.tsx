"use client";

import { AdminSkeleton } from "./AdminSkeleton";

import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ChartingFeesForm } from "./ChartingFeesForm";
import { useClinicFeesEditor } from "./useClinicFeesEditor";

export function ChartingFeesEditor() {
  const editor = useClinicFeesEditor();
  if (editor.loading) {
    return (
      <div aria-busy="true" className="space-y-8">
        <span className="sr-only">Loading clinic prices…</span>
        <section className="space-y-3">
          <AdminSkeleton className="h-4 w-32" />
          <AdminSkeleton className="h-3 w-72" />
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2, 3].map((slot) => (
              <AdminSkeleton key={slot} className="h-8 w-28 rounded-full" />
            ))}
          </div>
        </section>
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <AdminSkeleton className="h-4 w-36" />
            <AdminSkeleton className="h-9 w-48 rounded-md" />
          </div>
          <div className="overflow-hidden rounded-lg border border-[var(--admin-border,#e5e7eb)]">
            {["w-40", "w-52", "w-36", "w-48", "w-44"].map((w) => (
              <div
                key={w}
                className="flex items-center gap-3 border-b border-[var(--admin-border,#e5e7eb)] px-3 py-2.5 last:border-b-0"
              >
                <AdminSkeleton className="h-3.5 w-12" />
                <AdminSkeleton className={`h-3.5 ${w}`} />
                <AdminSkeleton className="ml-auto h-8 w-24 rounded-md" />
                <AdminSkeleton className="size-8 rounded-md" />
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <ChartingFeesForm
        fees={editor.fees}
        presets={editor.presets}
        pending={editor.pending}
        onAdd={(code) => void editor.onAdd(code)}
        onFeeChange={(code, feeEgp) =>
          editor.setFees((prev) =>
            prev.map((row) =>
              row.code === code ? { ...row, fee_egp: feeEgp } : row,
            ),
          )
        }
        onFeeBlur={(code, feeEgp) => void editor.persistFee(code, feeEgp)}
        onRemove={editor.setRemoveCode}
        onPresetChange={(slot, code) => void editor.onPresetChange(slot, code)}
      />
      <ConfirmDeleteDialog
        open={Boolean(editor.removeCode)}
        onOpenChange={(open) => {
          if (!open) editor.setRemoveCode(null);
        }}
        title="Remove this treatment?"
        description="It will leave the clinic menu. Favorites must be changed first."
        pending={editor.pending}
        onConfirm={() => void editor.confirmRemove()}
      />
    </div>
  );
}
