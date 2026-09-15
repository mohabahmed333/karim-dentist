"use client";

import { useEffect, useRef } from "react";
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
import { subscribeAdminLive } from "@/features/admin/lib/whatsappLiveClient";
import {
  playWhatsappInboundChime,
  unlockWhatsappInboundChime,
} from "@/features/admin/lib/whatsappInboundChime";

type Props = {
  balances: PatientBalance[];
  proposals: PendingProposalWithPatient[];
  paymentQueue: BillingPaymentQueueRow[];
  doctors: { id: string; display_name: string | null }[];
};

/** Long enough not to hammer the server, short enough that a dropped socket
 *  cannot hide a bill for a whole shift. */
const BILLING_POLL_MS = 30_000;

export function BillingBalancesView({ balances, proposals, paymentQueue, doctors }: Props) {
  const router = useRouter();
  const t = useTranslations();
  const { locale } = useLocale();

  // Realtime drives the chime; the interval is what makes it correct. A
  // websocket that dies quietly would otherwise leave the front desk staring
  // at a queue that stopped updating, with nothing to say so.
  const known = useRef(new Set(proposals.map((p) => p.id)));
  useEffect(() => {
    const unlock = () => unlockWhatsappInboundChime();
    window.addEventListener("pointerdown", unlock, { once: true });

    const stop = subscribeAdminLive((event) => {
      if (event.table !== "treatment_proposals") return;
      if (event.eventType !== "INSERT" || !event.row) return;
      // Only a bill nobody has seen yet should make a sound.
      if (known.current.has(event.row.id)) return;
      known.current.add(event.row.id);
      playWhatsappInboundChime();
      router.refresh();
    });

    const poll = window.setInterval(() => router.refresh(), BILLING_POLL_MS);
    return () => {
      window.removeEventListener("pointerdown", unlock);
      stop();
      window.clearInterval(poll);
    };
  }, [router]);

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
