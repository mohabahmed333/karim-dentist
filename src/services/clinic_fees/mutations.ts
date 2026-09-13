import type { createClient as createServerClient } from "@/lib/supabase/server";
import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { ClinicCdtFee } from "./types";

type AnySupabase =
  | Awaited<ReturnType<typeof createServerClient>>
  | ReturnType<typeof createBrowserClient>;

export async function upsertClinicCdtFee(
  supabase: AnySupabase,
  code: string,
  feeEgp: number,
): Promise<ClinicCdtFee> {
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

export async function deleteClinicCdtFee(
  supabase: AnySupabase,
  code: string,
): Promise<void> {
  const { error } = await supabase
    .from("clinic_cdt_fees")
    .delete()
    .eq("code", code);
  if (error) throw error;
}

export async function saveClinicFeeSchedule(
  supabase: AnySupabase,
  fees: ReadonlyArray<{ code: string; fee_egp: number }>,
): Promise<void> {
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
  supabase: AnySupabase,
  presets: ReadonlyArray<{ slot: number; code: string; label: string }>,
): Promise<void> {
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
