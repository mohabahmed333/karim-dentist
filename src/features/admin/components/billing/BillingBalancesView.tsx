"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { CollectionTable, type CollectionColumn } from "@/features/admin/components/CollectionTable";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { patientProfilePath } from "@/services/reservations/patientHistory";
import type { PatientBalance } from "@/services/patient_billing/types";
import type { PendingProposalWithPatient } from "@/services/treatment_proposals/queries";
import type { BillingPaymentQueueRow } from "@/services/billing_payments/queries";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale, useTranslations } from "@/lib/i18n";
import { PendingBillingRequestsList } from "./PendingBillingRequestsList";
import { BillingPaymentReviewList } from "./BillingPaymentReviewList";

type Props = {
  balances: PatientBalance[];
  proposals: PendingProposalWithPatient[];
  paymentQueue: BillingPaymentQueueRow[];
  doctors: { id: string; display_name: string | null }[];
};

export function BillingBalancesView({ balances, proposals, paymentQueue, doctors }: Props) {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();

  const columns: CollectionColumn<PatientBalance>[] = [
    {
      key: "displayName",
      header: t("admin.billing.patient"),
      cell: (row) => row.displayName,
      sortable: true,
      sortValue: (row) => row.displayName,
    },
    {
      key: "phone",
      header: t("admin.billing.phone"),
      cell: (row) => row.phone,
    },
    {
      key: "balance",
      header: t("admin.billing.balance"),
      cell: (row) => (
        <span className={row.balance > 0 ? "text-red-600" : "text-emerald-600"}>
          {formatEgp(Math.abs(row.balance), locale)}
          {row.balance > 0 ? "" : " (credit)"}
        </span>
      ),
      sortable: true,
      sortValue: (row) => row.balance,
    },
  ];

  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.nav.billing"
        descriptionKey="admin.billing.clinicDescription"
      />
      <PendingBillingRequestsList proposals={proposals} doctors={doctors} />
      <BillingPaymentReviewList rows={paymentQueue} />
      <Card className="bg-transparent p-0">
        <CollectionTable
          rows={balances}
          columns={columns}
          tableId="billing-balances"
          getRowId={(row) => row.patientKey}
          onRowClick={(id) => router.push(patientProfilePath(id))}
          emptyMessage={t("admin.billing.empty")}
        />
      </Card>
    </AdminPageMotion>
  );
}
