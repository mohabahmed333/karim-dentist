"use client";

import { ClinicMenuAddPicker } from "./ClinicMenuAddPicker";
import { ClinicMenuList } from "./ClinicMenuList";

type FeeDraft = { code: string; fee_egp: number };
type PresetDraft = { slot: number; code: string; label: string };

type Props = {
  fees: FeeDraft[];
  /** Still needed here — a favorited code is locked from removal (canRemoveFromMenu), even though this page no longer edits favorites. */
  presets: PresetDraft[];
  pending: boolean;
  onAdd: (code: string) => void;
  onFeeChange: (code: string, feeEgp: number) => void;
  onFeeBlur: (code: string, feeEgp: number) => void;
  onRemove: (code: string) => void;
};

export function ChartingFeesForm({
  fees,
  presets,
  pending,
  onAdd,
  onFeeChange,
  onFeeBlur,
  onRemove,
}: Props) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <ClinicMenuAddPicker
          menuCodes={new Set(fees.map((row) => row.code))}
          disabled={pending}
          onAdd={onAdd}
        />
        <ClinicMenuList
          fees={fees}
          presets={presets}
          onFeeChange={onFeeChange}
          onFeeBlur={onFeeBlur}
          onRemove={onRemove}
        />
      </section>
    </div>
  );
}
