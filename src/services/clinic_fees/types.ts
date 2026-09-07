export type ClinicCdtFee = {
  code: string;
  fee_egp: number;
  updated_at: string;
};

export type ClinicTreatmentPreset = {
  slot: number;
  code: string;
  label: string;
  updated_at: string;
};

export type {
  ChairsidePreset,
  ClinicFeeRow,
  ClinicPresetRow,
} from "./resolvePresets";
