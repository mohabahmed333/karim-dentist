import { createClient } from "@/lib/supabase/server";
import { listPatientBalances } from "@/services/patient_billing/queries";
import { listAllPendingProposals } from "@/services/treatment_proposals/queries";
import { listPendingBillingPayments } from "@/services/billing_payments/queries";
import { listDoctors } from "@/services/profiles";
import { hasApprovedTemplate } from "@/services/patient_notifications/templates";
import { BillingBalancesView } from "@/features/admin/components/billing/BillingBalancesView";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminBillingPage() {
  await requirePagePermission("patients.view");
  const supabase = await createClient();
  const [balances, proposals, paymentQueue, doctors] = await Promise.all([
    listPatientBalances(supabase),
    listAllPendingProposals(supabase),
    listPendingBillingPayments(supabase),
    listDoctors(supabase),
  ]);
  return (
    <BillingBalancesView
      canRequestWhatsapp={hasApprovedTemplate("billing_payment_request")}
      balances={balances}
      proposals={proposals}
      paymentQueue={paymentQueue}
      doctors={doctors.map((d) => ({ id: d.id, display_name: d.display_name }))}
    />
  );
}
