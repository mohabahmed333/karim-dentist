import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { DoctorsManager } from "@/features/admin/components/doctors/DoctorsManager";
import { Card } from "@/components/ui/card";
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
      <LocalizedAdminPageHeader titleKey="admin.settings.doctors" />
      <Card className="max-w-3xl gap-0 p-6">
        <DoctorsManager doctors={doctors} initialHours={initialHours} />
      </Card>
    </AdminPageMotion>
  );
}
