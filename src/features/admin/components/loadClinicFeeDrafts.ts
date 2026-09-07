import {
  listClinicCdtFees,
  listClinicTreatmentPresets,
} from "@/services/clinic_fees";
import type { FeeDraft, PresetDraft } from "./clinicFeesDrafts";

export async function loadClinicFeeDrafts(): Promise<{
  fees: FeeDraft[];
  presets: PresetDraft[] | null;
}> {
  const [feeRows, presetRows] = await Promise.all([
    listClinicCdtFees(),
    listClinicTreatmentPresets(),
  ]);
  return {
    fees: feeRows.map((row) => ({ code: row.code, fee_egp: row.fee_egp })),
    presets:
      presetRows.length > 0
        ? presetRows.map((row) => ({
            slot: row.slot,
            code: row.code,
            label: row.label,
          }))
        : null,
  };
}
