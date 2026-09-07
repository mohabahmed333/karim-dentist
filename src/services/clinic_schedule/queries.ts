import { createClient } from "@/lib/supabase/client";
import type { AppointmentSlot, ClinicHours } from "./types";

const HOURS_ID = "00000000-0000-4000-8000-000000000001";

export async function getClinicHours(): Promise<ClinicHours> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clinic_hours")
    .select("*")
    .eq("id", HOURS_ID)
    .maybeSingle();
  if (error) throw error;
  if (data) return data as ClinicHours;
  const { data: created, error: insertError } = await supabase
    .from("clinic_hours")
    .insert({ id: HOURS_ID })
    .select("*")
    .single();
  if (insertError) throw insertError;
  return created as ClinicHours;
}

export async function listOpenAppointmentSlots(opts?: {
  fromIso?: string;
  toIso?: string;
}): Promise<AppointmentSlot[]> {
  const supabase = createClient();
  let q = supabase
    .from("appointment_slots")
    .select("*")
    .eq("status", "open")
    .order("starts_at", { ascending: true });
  if (opts?.fromIso) q = q.gte("starts_at", opts.fromIso);
  if (opts?.toIso) q = q.lte("starts_at", opts.toIso);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as AppointmentSlot[];
}
