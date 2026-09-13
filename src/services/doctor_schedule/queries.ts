import type { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { createServiceClient } from "@/lib/supabase/service";
import type { DoctorHours } from "./types";

type AnySupabase =
  | ReturnType<typeof createServiceClient>
  | Awaited<ReturnType<typeof createBrowserClient>>
  | Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

export async function listDoctorHours(
  supabase: AnySupabase,
): Promise<DoctorHours[]> {
  const { data, error } = await supabase.from("doctor_hours").select("*");
  if (error) throw error;
  return data ?? [];
}

export async function getDoctorHours(
  supabase: AnySupabase,
  doctorId: string,
): Promise<DoctorHours | null> {
  const { data, error } = await supabase
    .from("doctor_hours")
    .select("*")
    .eq("doctor_id", doctorId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
