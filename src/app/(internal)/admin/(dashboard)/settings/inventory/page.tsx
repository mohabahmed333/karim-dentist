import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { InventorySettingsForm } from "@/features/admin/components/inventory/InventorySettingsForm";
import { createClient } from "@/lib/supabase/server";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminSettingsInventoryPage() {
  await requirePagePermission("settings.view");
  const supabase = await createClient();
  const { data } = await supabase.from("inventory_settings").select("*").limit(1).maybeSingle();

  return (
    <AdminPageMotion className="space-y-4">
      <InventorySettingsForm
        initial={
          data ?? {
            id: "00000000-0000-4000-8000-0000000000c1",
            mode: "off",
            manager_whatsapp_phone: null,
            wastage_approval_threshold_egp: 500,
            wastage_photo_threshold_egp: 1000,
            realert_after_days: 3,
            updated_at: new Date(0).toISOString(),
          }
        }
      />
    </AdminPageMotion>
  );
}
