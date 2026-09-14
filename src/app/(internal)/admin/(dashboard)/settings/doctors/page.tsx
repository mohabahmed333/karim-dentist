import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { DoctorsManager } from "@/features/admin/components/doctors/DoctorsManager";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { createClient } from "@/lib/supabase/server";
import { listDoctors } from "@/services/profiles";
import { listDoctorHours } from "@/services/doctor_schedule/queries";
import type { DoctorHours } from "@/services/doctor_schedule/types";

export const dynamic = "force-dynamic";

export default async function AdminSettingsDoctorsPage() {
  await requirePagePermission("settings.view");
  const supabase = await createClient();

  const [doctors, hours] = await Promise.all([
    listDoctors(supabase),
    listDoctorHours(supabase),
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
      <DoctorsManager doctors={doctors} initialHours={initialHours} />
    </AdminPageMotion>
  );
}
