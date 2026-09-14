import type { createClient as createServerClient } from "@/lib/supabase/server";

type ServerSupabase = Awaited<ReturnType<typeof createServerClient>>;

export type DoctorServiceEntry = { serviceId: string; priceLabel: string | null };

/**
 * Replace-all: this doctor's full set of mapped services, each with its own
 * optional price override, mirroring updateRolePermissions's delete-then-insert
 * shape in @/services/roles/mutations.ts. An empty array is a legitimate save —
 * it puts the doctor back to "no explicit mapping" for every service they were
 * previously restricted to, not an error.
 */
export async function setDoctorServiceIds(
  supabase: ServerSupabase,
  doctorId: string,
  entries: DoctorServiceEntry[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("service_doctors")
    .delete()
    .eq("doctor_id", doctorId);
  if (deleteError) throw deleteError;

  if (entries.length === 0) return;

  const { error: insertError } = await supabase.from("service_doctors").insert(
    entries.map(({ serviceId, priceLabel }) => ({
      service_id: serviceId,
      doctor_id: doctorId,
      price_label: priceLabel,
    })),
  );
  if (insertError) throw insertError;
}
