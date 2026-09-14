"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import type { LedgerEntryWithBalance } from "@/services/patient_billing/types";
import { formatEgp } from "@/services/deposits/receiptMessages";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import type { PriceableService, PriceableDoctor } from "@/services/service_doctors/pricing";
import type { Reservation } from "@/services/reservations/types";
import { ProposeServicesForm } from "./ProposeServicesForm";
import { AddChargeForm } from "./AddChargeForm";
import { PendingProposalsList } from "./PendingProposalsList";
import type { PendingProposal } from "@/services/treatment_proposals/types";
import { useLocale } from "@/lib/i18n";

type Props = {
  patientKey: string;
  displayName: string;
  entries: LedgerEntryWithBalance[];
  balance: number;
  canEdit: boolean;
  /** For the optional "which service, which doctor" price-lookup on a charge. */
  services: PriceableService[];
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  /** This patient's visits, for the "which visit is this for?" pickers. */
  reservations: Reservation[];
  patientPhone: string;
  canPropose: boolean;
  pendingProposals: PendingProposal[];
};

export function PatientBillingView({
  patientKey,
  displayName,
  entries: initialEntries,
  balance: initialBalance,
  canEdit,
  services,
  doctors,
  serviceDoctorMappings,
  reservations,
  patientPhone,
  canPropose,
  pendingProposals,
}: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const [entries, setEntries] = useState(initialEntries);
  const [balance, setBalance] = useState(initialBalance);

  function onChargeRecorded(entry: LedgerEntryWithBalance) {
    setEntries((prev) => [...prev, entry]);
    setBalance(entry.balanceAfter);
  }

  return (
    <AdminPageMotion className="max-w-6xl space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.billing.patientTitle"
        descriptionKey="admin.billing.patientDescription"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="gap-2 bg-transparent p-6">
            <p className="text-sm text-[var(--admin-muted)]">{displayName}</p>
            <p
              className={`text-2xl font-semibold ${balance > 0 ? "text-red-600" : "text-emerald-600"}`}
            >
              {formatEgp(Math.abs(balance), locale)}
              {balance > 0 ? " owed" : balance < 0 ? " credit" : ""}
            </p>
          </Card>

          <PendingProposalsList
            proposals={pendingProposals}
            doctors={doctors}
            onDecided={() => router.refresh()}
          />
        </div>

        <div className="space-y-4">
          {canPropose ? (
            <ProposeServicesForm
              patientKey={patientKey}
              patientPhone={patientPhone}
              patientName={displayName}
              services={services}
              doctors={doctors}
              serviceDoctorMappings={serviceDoctorMappings}
              reservations={reservations}
              onSent={() => router.refresh()}
            />
          ) : null}

          {canEdit ? (
            <AddChargeForm
              patientKey={patientKey}
              services={services}
              doctors={doctors}
              serviceDoctorMappings={serviceDoctorMappings}
              reservations={reservations}
              balance={balance}
              onRecorded={onChargeRecorded}
            />
          ) : null}
        </div>
      </div>

      <Card className="gap-0 bg-transparent p-0">
        {entries.length === 0 ? (
          <p className="p-6 text-sm text-[var(--admin-muted)]">No billing activity yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--admin-border)]">
            {[...entries].reverse().map((entry) => (
              <li key={entry.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-[var(--admin-text)]">
                    {entry.description}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    {new Date(entry.date).toLocaleDateString()} · {entry.source}
                  </p>
                </div>
                <div className="shrink-0 text-end">
                  <p className={entry.kind === "charge" ? "text-red-600" : "text-emerald-600"}>
                    {entry.kind === "charge" ? "+" : "−"}
                    {formatEgp(entry.amount, locale)}
                  </p>
                  <p className="text-xs text-[var(--admin-muted)]">
                    Balance: {formatEgp(entry.balanceAfter, locale)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AdminPageMotion>
  );
}
