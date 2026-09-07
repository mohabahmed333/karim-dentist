import { TREATMENT_PRESETS, type TreatmentPreset } from "../cdt/presets";

export type ClinicFeeRow = { code: string; fee_egp: number };
export type ClinicPresetRow = { slot: number; code: string; label: string };

export type ChairsidePreset = {
  id: string;
  label: string;
  code: string;
  fee: number;
};

/** Merge clinic preset slots with fee schedule; fall back to hardcoded chips. */
export function resolveChairsidePresets(
  presets: readonly ClinicPresetRow[],
  fees: readonly ClinicFeeRow[],
): ChairsidePreset[] {
  if (presets.length === 0) {
    return TREATMENT_PRESETS.map((row: TreatmentPreset) => ({ ...row }));
  }
  const feeByCode = new Map(fees.map((row) => [row.code, row.fee_egp]));
  return [...presets]
    .sort((a, b) => a.slot - b.slot)
    .map((row) => ({
      id: `slot-${row.slot}`,
      label: row.label,
      code: row.code,
      fee: feeByCode.get(row.code) ?? 0,
    }));
}
