import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { PaymentMethodsForm } from "@/features/admin/components/PaymentMethodsForm";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { createClient } from "@/lib/supabase/server";
import { listPaymentMethods } from "@/services/payment_methods/queries";

export const dynamic = "force-dynamic";

export default async function AdminPaymentMethodsPage() {
  const session = await requirePagePermission("settings.view");
  const supabase = await createClient();
  const methods = await listPaymentMethods(supabase).catch(() => []);

  return (
    <AdminPageMotion className="space-y-4">
      <PaymentMethodsForm
        initialMethods={methods}
        canEdit={session.permissions.has("settings.edit")}
      />
    </AdminPageMotion>
  );
}
