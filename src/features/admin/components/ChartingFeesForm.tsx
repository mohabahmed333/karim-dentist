"use client";

import { ChartingFeesChips } from "./ChartingFeesChips";
import { ClinicMenuAddPicker } from "./ClinicMenuAddPicker";
import { ClinicMenuList } from "./ClinicMenuList";

type FeeDraft = { code: string; fee_egp: number };
type PresetDraft = { slot: number; code: string; label: string };

type Props = {
  fees: FeeDraft[];
  presets: PresetDraft[];
  pending: boolean;
  onAdd: (code: string) => void;
  onFeeChange: (code: string, feeEgp: number) => void;
  onFeeBlur: (code: string, feeEgp: number) => void;
  onRemove: (code: string) => void;
  onPresetChange: (slot: number, code: string) => void;
};

export function ChartingFeesForm({
  fees,
  presets,
  pending,
  onAdd,
  onFeeChange,
  onFeeBlur,
  onRemove,
  onPresetChange,
}: Props) {
  return (
    <div className="space-y-8">
      <ChartingFeesChips
        fees={fees}
        presets={presets}
        onPresetChange={onPresetChange}
      />
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
