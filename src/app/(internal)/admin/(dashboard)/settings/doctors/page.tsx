import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { DoctorsManager } from "@/features/admin/components/doctors/DoctorsManager";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { createClient } from "@/lib/supabase/server";
import { listDoctors } from "@/services/profiles";
import { listDoctorHours } from "@/services/doctor_schedule/queries";
import type { DoctorHours } from "@/services/doctor_schedule/types";
import { listAllServiceDoctorMappings } from "@/services/service_doctors/queries";

export const dynamic = "force-dynamic";

export default async function AdminSettingsDoctorsPage() {
  await requirePagePermission("settings.view");
  const supabase = await createClient();

  const [doctors, hours, services, mappings] = await Promise.all([
    listDoctors(supabase),
    listDoctorHours(supabase),
    // Every non-deleted service, not just published ones — an admin should
    // be able to map a doctor to a service before it goes live. Same query
    // the services admin page itself uses.
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .order("sort_order", { ascending: true }),
    listAllServiceDoctorMappings(supabase),
  ]);

  const initialHours = hours.reduce<Record<string, DoctorHours>>(
    (acc, row) => {
      acc[row.doctor_id] = row;
      return acc;
    },
    {},
  );

  return (
    <AdminPageMotion className="space-y-4">
      <DoctorsManager
        doctors={doctors}
        initialHours={initialHours}
        services={services.data ?? []}
        initialMappings={mappings}
      />
    </AdminPageMotion>
  );
}
