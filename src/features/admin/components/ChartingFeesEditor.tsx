"use client";

import { ConfirmDeleteDialog } from "./ConfirmDeleteDialog";
import { ChartingFeesForm } from "./ChartingFeesForm";
import { useClinicFeesEditor } from "./useClinicFeesEditor";

export function ChartingFeesEditor() {
  const editor = useClinicFeesEditor();
  if (editor.loading) {
    return <p className="text-sm text-[#64748B]">Loading clinic prices…</p>;
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
