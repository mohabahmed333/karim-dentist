import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

/**
 * Replace-all: this doctor's full set of mapped services, mirroring
 * updateRolePermissions's delete-then-insert shape in
 * @/services/roles/mutations.ts. An empty array is a legitimate save — it
 * puts the doctor back to "no explicit mapping" for every service they were
 * previously restricted to, not an error.
 */
export async function setDoctorServiceIds(
  supabase: ServerSupabase,
  doctorId: string,
  serviceIds: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("service_doctors")
    .delete()
    .eq("doctor_id", doctorId);
  if (deleteError) throw deleteError;

  if (serviceIds.length === 0) return;

  const { error: insertError } = await supabase.from("service_doctors").insert(
    serviceIds.map((service_id) => ({
      service_id,
      doctor_id: doctorId,
    })),
  );
  if (insertError) throw insertError;
}
