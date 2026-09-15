"use client";

import { useState, type ReactNode } from "react";
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
  AdminTextarea,
} from "@/features/admin/ui";
import { useTranslations } from "@/lib/i18n";
import { saveTreatmentProposal } from "@/services/treatment_proposals/actions";
import {
  resolveServiceDoctorPrice,
  extractSingleAmount,
  type PriceableService,
  type PriceableDoctor,
} from "@/services/service_doctors/pricing";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import type { Reservation } from "@/services/reservations/types";
import { formatAppointmentDateTime } from "@/services/patient_notifications/formatWhen";
import { ServiceSearchSelect } from "./ServiceSearchSelect";

export type DraftItem = { serviceId: string; description: string; amount: string };

function emptyItem(): DraftItem {
  return { serviceId: "", description: "", amount: "" };
}

/**
 * Not a real reservation id — the value the "no specific visit" option
 * carries. Select items can't take an empty-string value, so this is a
 * sentinel, converted back to null right before it's sent.
 */
const NO_RESERVATION = "none";

type Props = {
  patientKey: string;
  patientPhone: string;
  patientName: string;
  services: PriceableService[];
  doctors: PriceableDoctor[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
  /** This patient's visits, for the optional "which visit is this for?" picker. */
  reservations: Reservation[];
  onSent: () => void;
  /** Seeds the form instead of starting blank — e.g. an AI draft proposing a starting point. */
  initialDoctorId?: string;
  initialItems?: DraftItem[];
  initialReservationId?: string | null;
  /**
   * Hide the doctor picker because we already know who is billing — a doctor
   * billing their own patient shouldn't have to find themselves in a list.
   * Ignored without an `initialDoctorId`, so it can never hide the only way
   * to set a required field.
   */
  lockDoctor?: boolean;
  /** Drop the Card wrapper — inside a dialog it double-pads. */
  bare?: boolean;
  /** `null` hides the heading, for a dialog that has its own title. */
  title?: string | null;
  submitLabel?: string;
};

export function ProposeServicesForm({
  patientKey,
  patientPhone,
  patientName,
  services,
  doctors,
  serviceDoctorMappings,
  reservations,
  onSent,
  initialDoctorId,
  initialItems,
  initialReservationId,
  lockDoctor = false,
  bare = false,
  title,
  submitLabel,
}: Props) {
  const t = useTranslations();
  const [doctorId, setDoctorId] = useState(initialDoctorId ?? "");
  const [items, setItems] = useState<DraftItem[]>(initialItems ?? [emptyItem()]);
  const [reservationId, setReservationId] = useState(initialReservationId ?? NO_RESERVATION);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const hideDoctor = lockDoctor && Boolean(initialDoctorId);
  const heading = title === undefined ? t("admin.billing.proposal.title") : title;

  function patchItem(index: number, partial: Partial<DraftItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...partial } : item)));
  }

  function pickService(index: number, serviceId: string) {
    const service = services.find((s) => s.id === serviceId);
    const price = doctorId
      ? resolveServiceDoctorPrice(serviceId, doctorId, serviceDoctorMappings, service?.price_label ?? null)
      : (service?.price_label ?? null);
    patchItem(index, {
      serviceId,
      description: service?.title ?? "",
      amount: extractSingleAmount(price) ?? "",
    });
  }

  async function onSubmit() {
    if (!doctorId) {
      toast.error(t("admin.billing.proposal.pickDoctor"));
      return;
    }
    const parsedItems = items
      .filter((item) => item.serviceId)
      .map((item) => ({
        serviceId: item.serviceId,
        description: item.description.trim(),
        amountEgp: Number(item.amount),
      }));
    if (parsedItems.length === 0) {
      toast.error(t("admin.billing.proposal.addAtLeastOne"));
      return;
    }
    if (parsedItems.some((item) => !Number.isFinite(item.amountEgp) || item.amountEgp <= 0)) {
      toast.error(t("admin.billing.proposal.invalidAmountEach"));
      return;
    }
    setPending(true);
    try {
      await saveTreatmentProposal(patientKey, patientPhone, patientName, {
        doctorId,
        items: parsedItems,
        reservationId: reservationId === NO_RESERVATION ? null : reservationId,
        note: note.trim() || undefined,
      });
      // A locked doctor is who the user is, not a choice they made — keep it.
      if (!hideDoctor) setDoctorId("");
      setItems([emptyItem()]);
      setReservationId(NO_RESERVATION);
      setNote("");
      toast.success(t("admin.billing.proposal.sent"));
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.billing.proposal.sendFailed"));
    } finally {
      setPending(false);
    }
  }

  const Wrapper = bare ? BareWrapper : CardWrapper;

  return (
    <Wrapper>
      {heading ? (
        <p className="text-sm font-medium text-[var(--admin-text)]">{heading}</p>
      ) : null}
      {hideDoctor ? null : (
        <AdminSelect value={doctorId} onValueChange={(value) => setDoctorId(String(value))}>
          <AdminSelectTrigger>
            <AdminSelectValue placeholder={t("admin.billing.form.doctorPlaceholder")} />
          </AdminSelectTrigger>
          <AdminSelectContent alignItemWithTrigger={false}>
            {doctors.map((doctor) => (
              <AdminSelectItem key={doctor.id} value={doctor.id}>
                {doctor.display_name ?? t("admin.billing.form.unnamedDoctor")}
              </AdminSelectItem>
            ))}
          </AdminSelectContent>
        </AdminSelect>
      )}

      {reservations.length > 0 ? (
        <AdminSelect
          value={reservationId}
          onValueChange={(value) => setReservationId(String(value))}
        >
          <AdminSelectTrigger>
            <AdminSelectValue placeholder={t("admin.billing.form.visitPlaceholder")} />
          </AdminSelectTrigger>
          <AdminSelectContent alignItemWithTrigger={false}>
            <AdminSelectItem value={NO_RESERVATION}>{t("admin.billing.form.notTiedToVisit")}</AdminSelectItem>
            {reservations.map((reservation) => (
              <AdminSelectItem key={reservation.id} value={reservation.id}>
                {reservation.service_label} — {formatAppointmentDateTime(reservation.starts_at, "en")}
              </AdminSelectItem>
            ))}
          </AdminSelectContent>
        </AdminSelect>
      ) : null}

      {items.map((item, index) => (
        <div
          key={index}
          className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--admin-border)] p-3 sm:grid-cols-[1fr_1fr_auto]"
        >
          <ServiceSearchSelect
            services={services}
            value={item.serviceId}
            onChange={(serviceId) => pickService(index, serviceId)}
            placeholder={t("admin.billing.proposal.servicePlaceholder")}
          />
          <AdminInput
            placeholder={t("admin.billing.form.amountPlaceholder")}
            inputMode="decimal"
            value={item.amount}
            onChange={(e) => patchItem(index, { amount: e.target.value })}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={items.length === 1}
            onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
          >
            {t("admin.billing.proposal.remove")}
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
        {t("admin.billing.proposal.addService")}
      </Button>
      <AdminTextarea
        rows={2}
        maxLength={500}
        value={note}
        placeholder={t("admin.billing.proposal.notePlaceholder")}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
        {pending
          ? t("admin.billing.proposal.sending")
          : (submitLabel ?? t("admin.billing.proposal.send"))}
      </Button>
    </Wrapper>
  );
}

function CardWrapper({ children }: { children: ReactNode }) {
  return <Card className="h-full gap-3 bg-transparent p-6">{children}</Card>;
}

function BareWrapper({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3">{children}</div>;
}
