import { createPublicClient } from "@/lib/supabase/public";
import type { ClinicHours } from "./types";

const HOURS_ID = "00000000-0000-4000-8000-000000000001";

/**
 * Anon-key read for public rendering (structured data, llms.txt). Unlike
 * `getClinicHours` in queries.ts, this never inserts the default row — a
 * Server Component render should not have write side effects. Returns null
 * if the singleton row is missing so callers can omit openingHours instead
 * of guessing at a schedule.
 */
export async function getPublicClinicHours(): Promise<ClinicHours | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("clinic_hours")
    .select("*")
    .eq("id", HOURS_ID)
    .maybeSingle();
  if (error) throw error;
  return (data as ClinicHours | null) ?? null;
}
