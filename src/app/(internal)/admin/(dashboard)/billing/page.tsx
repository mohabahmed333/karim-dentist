import { createClient } from "@/lib/supabase/server";
import { listPatientBalances } from "@/services/patient_billing/queries";
import { BillingBalancesView } from "@/features/admin/components/billing/BillingBalancesView";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  await requirePagePermission("patients.view");
  const supabase = await createClient();
  const balances = await listPatientBalances(supabase);
  return <BillingBalancesView balances={balances} />;
}
