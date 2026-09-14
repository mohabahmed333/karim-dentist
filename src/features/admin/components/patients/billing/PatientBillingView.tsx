"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AdminInput,
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui";
import { LocalizedAdminPageHeader } from "@/features/admin/components/LocalizedAdminPageHeader";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { saveBillingEntry } from "@/services/patient_billing/actions";
import type { LedgerEntryWithBalance } from "@/services/patient_billing/types";
import { formatEgp } from "@/services/deposits/receiptMessages";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import { extractSingleAmount, resolveServiceDoctorPrice } from "@/services/service_doctors/pricing";
import { ProposeServicesForm } from "./ProposeServicesForm";
import { PendingProposalsList } from "./PendingProposalsList";
import type { PendingProposal } from "@/services/treatment_proposals/types";
import { useLocale } from "@/lib/i18n";

type FormState = {
  kind: "charge" | "payment";
  amount: string;
  description: string;
  method: "cash" | "card" | "instapay" | "other";
};

function defaultForm(): FormState {
  return { kind: "payment", amount: "", description: "", method: "cash" };
}

type PriceableService = { id: string; title: string; price_label: string | null };
type PriceableDoctor = { id: string; display_name: string | null };

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
  patientPhone,
  canPropose,
  pendingProposals,
}: Props) {
  const router = useRouter();
  const { locale } = useLocale();
  const [entries, setEntries] = useState(initialEntries);
  const [balance, setBalance] = useState(initialBalance);
  const [form, setForm] = useState<FormState>(defaultForm());
  const [pending, setPending] = useState(false);
  // Purely a convenience lookup for the amount field below — the saved charge
  // itself still only ever stores amount + description, nothing service- or
  // doctor-specific.
  const [priceServiceId, setPriceServiceId] = useState("");
  const [priceDoctorId, setPriceDoctorId] = useState("");

  const resolvedPrice =
    priceServiceId && priceDoctorId
      ? resolveServiceDoctorPrice(
          priceServiceId,
          priceDoctorId,
          serviceDoctorMappings,
          services.find((s) => s.id === priceServiceId)?.price_label ?? null,
        )
      : null;

  function pickService(serviceId: string) {
    setPriceServiceId(serviceId);
    applyResolvedPrice(serviceId, priceDoctorId);
  }

  function pickDoctor(doctorId: string) {
    setPriceDoctorId(doctorId);
    applyResolvedPrice(priceServiceId, doctorId);
  }

  function applyResolvedPrice(serviceId: string, doctorId: string) {
    if (!serviceId || !doctorId) return;
    const label = resolveServiceDoctorPrice(
      serviceId,
      doctorId,
      serviceDoctorMappings,
      services.find((s) => s.id === serviceId)?.price_label ?? null,
    );
    const amount = extractSingleAmount(label);
    if (amount) setForm((prev) => ({ ...prev, amount }));
  }

  async function onSubmit() {
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!form.description.trim()) {
      toast.error("Enter a description");
      return;
    }
    setPending(true);
    try {
      await saveBillingEntry(patientKey, {
        kind: form.kind,
        amount_egp: amount,
        description: form.description.trim(),
        method: form.kind === "payment" ? form.method : null,
      });
      const newEntry: LedgerEntryWithBalance = {
        id: `pending:${Date.now()}`,
        date: new Date().toISOString(),
        kind: form.kind,
        source: "manual",
        amount,
        description: form.description.trim(),
        method: form.kind === "payment" ? form.method : null,
        balanceAfter: form.kind === "charge" ? balance + amount : balance - amount,
      };
      setEntries((prev) => [...prev, newEntry]);
      setBalance(newEntry.balanceAfter);
      setForm(defaultForm());
      setPriceServiceId("");
      setPriceDoctorId("");
      toast.success("Entry recorded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <AdminPageMotion className="space-y-4">
      <LocalizedAdminPageHeader
        titleKey="admin.billing.patientTitle"
        descriptionKey="admin.billing.patientDescription"
      />

      <Card className="max-w-3xl gap-2 bg-transparent p-6">
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

      {canPropose ? (
        <ProposeServicesForm
          patientKey={patientKey}
          patientPhone={patientPhone}
          patientName={displayName}
          services={services}
          doctors={doctors}
          serviceDoctorMappings={serviceDoctorMappings}
          onSent={() => router.refresh()}
        />
      ) : null}

      {canEdit ? (
        <Card className="max-w-3xl gap-3 bg-transparent p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AdminSelect
              value={form.kind}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, kind: value as FormState["kind"] }))
              }
            >
              <AdminSelectTrigger>
                <AdminSelectValue />
              </AdminSelectTrigger>
              <AdminSelectContent>
                <AdminSelectItem value="payment">Payment</AdminSelectItem>
                <AdminSelectItem value="charge">Charge</AdminSelectItem>
              </AdminSelectContent>
            </AdminSelect>
            {form.kind === "payment" ? (
              <AdminSelect
                value={form.method}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, method: value as FormState["method"] }))
                }
              >
                <AdminSelectTrigger>
                  <AdminSelectValue />
                </AdminSelectTrigger>
                <AdminSelectContent>
                  <AdminSelectItem value="cash">Cash</AdminSelectItem>
                  <AdminSelectItem value="card">Card</AdminSelectItem>
                  <AdminSelectItem value="instapay">InstaPay</AdminSelectItem>
                  <AdminSelectItem value="other">Other</AdminSelectItem>
                </AdminSelectContent>
              </AdminSelect>
            ) : null}
          </div>
          {form.kind === "charge" && services.length > 0 && doctors.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <AdminSelect value={priceServiceId} onValueChange={(value) => pickService(String(value))}>
                <AdminSelectTrigger>
                  <AdminSelectValue placeholder="Service (optional, for a price lookup)" />
                </AdminSelectTrigger>
                <AdminSelectContent>
                  {services.map((service) => (
                    <AdminSelectItem key={service.id} value={service.id}>
                      {service.title}
                    </AdminSelectItem>
                  ))}
                </AdminSelectContent>
              </AdminSelect>
              <AdminSelect value={priceDoctorId} onValueChange={(value) => pickDoctor(String(value))}>
                <AdminSelectTrigger>
                  <AdminSelectValue placeholder="Doctor" />
                </AdminSelectTrigger>
                <AdminSelectContent>
                  {doctors.map((doctor) => (
                    <AdminSelectItem key={doctor.id} value={doctor.id}>
                      {doctor.display_name ?? "Unnamed"}
                    </AdminSelectItem>
                  ))}
                </AdminSelectContent>
              </AdminSelect>
            </div>
          ) : null}
          {resolvedPrice ? (
            <p className="text-xs text-[var(--admin-muted)]">
              {doctors.find((d) => d.id === priceDoctorId)?.display_name ?? "This doctor"}’s price for{" "}
              {services.find((s) => s.id === priceServiceId)?.title ?? "this service"}: {resolvedPrice}
            </p>
          ) : null}
          <AdminInput
            placeholder="Amount (EGP)"
            inputMode="decimal"
            value={form.amount}
            onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
          />
          <AdminInput
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
            {pending ? "Saving…" : "Record entry"}
          </Button>
        </Card>
      ) : null}

      <Card className="max-w-3xl gap-0 bg-transparent p-0">
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
