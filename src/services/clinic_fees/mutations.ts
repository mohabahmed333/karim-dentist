import { createClient } from "@/lib/supabase/client";
import type { ClinicCdtFee } from "./types";

export async function upsertClinicCdtFee(
  code: string,
  feeEgp: number,
): Promise<ClinicCdtFee> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_cdt_fees")
    .upsert(
      {
        code,
        fee_egp: feeEgp,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "code" },
    )
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteClinicCdtFee(code: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("clinic_cdt_fees")
    .delete()
    .eq("code", code);
  if (error) throw error;
}

export async function saveClinicFeeSchedule(
  fees: ReadonlyArray<{ code: string; fee_egp: number }>,
): Promise<void> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("clinic_cdt_fees").upsert(
    fees.map((row) => ({
      code: row.code,
      fee_egp: row.fee_egp,
      updated_at: now,
    })),
    { onConflict: "code" },
  );
  if (error) throw error;
}

export async function saveClinicTreatmentPresets(
  presets: ReadonlyArray<{ slot: number; code: string; label: string }>,
): Promise<void> {
  const supabase = createClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("clinic_treatment_presets").upsert(
    presets.map((row) => ({
      slot: row.slot,
      code: row.code,
      label: row.label,
      updated_at: now,
    })),
    { onConflict: "slot" },
  );
  if (error) throw error;
}
