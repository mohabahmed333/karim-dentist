"use client";

import { useState } from "react";
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
import { useTranslations } from "@/lib/i18n";
import { saveBillingEntry } from "@/services/patient_billing/actions";
import type { LedgerEntryWithBalance } from "@/services/patient_billing/types";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import {
  extractSingleAmount,
  resolveServiceDoctorPrice,
  type PriceableService,
  type PriceableDoctor,
} from "@/services/service_doctors/pricing";
import type { Reservation } from "@/services/reservations/types";
import { formatAppointmentDateTime } from "@/services/patient_notifications/formatWhen";
import { ServiceSearchSelect } from "./ServiceSearchSelect";

type FormState = {
  kind: "charge" | "payment";
  amount: string;
  description: string;
  method: "cash" | "card" | "instapay" | "other";
};

function defaultForm(): FormState {
  return { kind: "payment", amount: "", description: "", method: "cash" };
}

/** Sentinel for "not tied to a visit" — Select items can't take an empty-string value. */
const NO_RESERVATION = "none";

type Props = {
  patientKey: string;
  services: PriceableService[];
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  /** This patient's visits, for the optional "which visit is this for?" picker. */
  reservations: Reservation[];
  /** Current running balance, to compute the new entry's balanceAfter. */
  balance: number;
  onRecorded: (entry: LedgerEntryWithBalance) => void;
};

/**
 * Manual "Add charge / Record payment" — the same form previously inline on
 * PatientBillingView, extracted so it can also render on the tooth chart
 * workspace page without duplicating the price-lookup/submit logic.
 */
export function AddChargeForm({
  patientKey,
  services,
  doctors,
  serviceDoctorMappings,
  reservations,
  balance,
  onRecorded,
}: Props) {
  const t = useTranslations();
  const [form, setForm] = useState<FormState>(defaultForm());
  const [pending, setPending] = useState(false);
  // Purely a convenience lookup for the amount field below — the saved entry
  // itself still only ever stores amount + description (+ optionally which
  // reservation), nothing service- or doctor-specific.
  const [priceServiceId, setPriceServiceId] = useState("");
  const [priceDoctorId, setPriceDoctorId] = useState("");
  const [reservationId, setReservationId] = useState(NO_RESERVATION);

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
      toast.error(t("admin.billing.form.invalidAmount"));
      return;
    }
    if (!form.description.trim()) {
      toast.error(t("admin.billing.form.invalidDescription"));
      return;
    }
    setPending(true);
    try {
      await saveBillingEntry(patientKey, {
        kind: form.kind,
        amount_egp: amount,
        description: form.description.trim(),
        method: form.kind === "payment" ? form.method : null,
        reservation_id: reservationId === NO_RESERVATION ? null : reservationId,
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
      onRecorded(newEntry);
      setForm(defaultForm());
      setPriceServiceId("");
      setPriceDoctorId("");
      setReservationId(NO_RESERVATION);
      toast.success(t("admin.billing.form.recorded"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="h-full gap-3 bg-transparent p-6">
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
            <AdminSelectItem value="payment">{t("admin.billing.form.payment")}</AdminSelectItem>
            <AdminSelectItem value="charge">{t("admin.billing.form.charge")}</AdminSelectItem>
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
              <AdminSelectItem value="cash">{t("admin.billing.form.cash")}</AdminSelectItem>
              <AdminSelectItem value="card">{t("admin.billing.form.card")}</AdminSelectItem>
              <AdminSelectItem value="instapay">{t("admin.billing.form.instapay")}</AdminSelectItem>
              <AdminSelectItem value="other">{t("admin.billing.form.other")}</AdminSelectItem>
            </AdminSelectContent>
          </AdminSelect>
        ) : null}
      </div>
      {form.kind === "charge" && services.length > 0 && doctors.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ServiceSearchSelect
            services={services}
            value={priceServiceId}
            onChange={pickService}
            placeholder={t("admin.billing.form.servicePlaceholder")}
          />
          <AdminSelect value={priceDoctorId} onValueChange={(value) => pickDoctor(String(value))}>
            <AdminSelectTrigger>
              <AdminSelectValue placeholder={t("admin.billing.form.doctorPlaceholder")} />
            </AdminSelectTrigger>
            <AdminSelectContent>
              {doctors.map((doctor) => (
                <AdminSelectItem key={doctor.id} value={doctor.id}>
                  {doctor.display_name ?? t("admin.billing.form.unnamedDoctor")}
                </AdminSelectItem>
              ))}
            </AdminSelectContent>
          </AdminSelect>
        </div>
      ) : null}
      {resolvedPrice ? (
        <p className="text-xs text-[var(--admin-muted)]">
          {t("admin.billing.form.priceLine")
            .replace(
              "{doctor}",
              doctors.find((d) => d.id === priceDoctorId)?.display_name ?? t("admin.billing.form.thisDoctor"),
            )
            .replace(
              "{service}",
              services.find((s) => s.id === priceServiceId)?.title ?? t("admin.billing.form.thisService"),
            )
            .replace("{price}", resolvedPrice)}
        </p>
      ) : null}
      {reservations.length > 0 ? (
        <AdminSelect value={reservationId} onValueChange={(value) => setReservationId(String(value))}>
          <AdminSelectTrigger>
            <AdminSelectValue placeholder={t("admin.billing.form.visitPlaceholder")} />
          </AdminSelectTrigger>
          <AdminSelectContent>
            <AdminSelectItem value={NO_RESERVATION}>{t("admin.billing.form.notTiedToVisit")}</AdminSelectItem>
            {reservations.map((reservation) => (
              <AdminSelectItem key={reservation.id} value={reservation.id}>
                {reservation.service_label} — {formatAppointmentDateTime(reservation.starts_at, "en")}
              </AdminSelectItem>
            ))}
          </AdminSelectContent>
        </AdminSelect>
      ) : null}
      <AdminInput
        placeholder={t("admin.billing.form.amountPlaceholder")}
        inputMode="decimal"
        value={form.amount}
        onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
      />
      <AdminInput
        placeholder={t("admin.billing.form.descriptionPlaceholder")}
        value={form.description}
        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
      />
      <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
        {pending ? t("admin.saving") : t("admin.billing.form.recordEntry")}
      </Button>
    </Card>
  );
}
