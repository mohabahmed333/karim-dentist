import type { ClinicFeeRow, ClinicPresetRow } from "./resolvePresets";
import { CDT_CATALOG } from "../cdt/catalog";
import { TREATMENT_PRESETS } from "../cdt/presets";

const PRESET_FEES = Object.fromEntries(
  TREATMENT_PRESETS.map((row) => [row.code, row.fee]),
) as Record<string, number>;

/** Default fee schedule seeded from the CDT catalog + known preset fees. */
export function defaultFeeSchedule(): ClinicFeeRow[] {
  return CDT_CATALOG.map((row) => ({
    code: row.code,
    fee_egp: PRESET_FEES[row.code] ?? 0,
  }));
}

export function defaultPresetSlots(): ClinicPresetRow[] {
  return TREATMENT_PRESETS.map((row, index) => ({
    slot: index + 1,
    code: row.code,
    label: row.label,
  }));
}
