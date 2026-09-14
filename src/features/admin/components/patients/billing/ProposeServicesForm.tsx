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
}: Props) {
  const [doctorId, setDoctorId] = useState(initialDoctorId ?? "");
  const [items, setItems] = useState<DraftItem[]>(initialItems ?? [emptyItem()]);
  const [reservationId, setReservationId] = useState(initialReservationId ?? NO_RESERVATION);
  const [pending, setPending] = useState(false);

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
      toast.error("Pick a doctor");
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
      toast.error("Add at least one service");
      return;
    }
    if (parsedItems.some((item) => !Number.isFinite(item.amountEgp) || item.amountEgp <= 0)) {
      toast.error("Enter a valid amount for every service");
      return;
    }
    setPending(true);
    try {
      await saveTreatmentProposal(patientKey, patientPhone, patientName, {
        doctorId,
        items: parsedItems,
        reservationId: reservationId === NO_RESERVATION ? null : reservationId,
      });
      setDoctorId("");
      setItems([emptyItem()]);
      setReservationId(NO_RESERVATION);
      toast.success("Proposal sent");
      onSent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Send failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="h-full gap-3 bg-transparent p-6">
      <p className="text-sm font-medium text-[var(--admin-text)]">Propose services</p>
      <AdminSelect value={doctorId} onValueChange={(value) => setDoctorId(String(value))}>
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

      {reservations.length > 0 ? (
        <AdminSelect
          value={reservationId}
          onValueChange={(value) => setReservationId(String(value))}
        >
          <AdminSelectTrigger>
            <AdminSelectValue placeholder="Which visit is this for? (optional)" />
          </AdminSelectTrigger>
          <AdminSelectContent>
            <AdminSelectItem value={NO_RESERVATION}>Not tied to a visit</AdminSelectItem>
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
            placeholder="Service"
          />
          <AdminInput
            placeholder="Amount (EGP)"
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
            Remove
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => setItems((prev) => [...prev, emptyItem()])}>
        Add service
      </Button>
      <Button type="button" disabled={pending} onClick={() => void onSubmit()}>
        {pending ? "Sending…" : "Send proposal"}
      </Button>
    </Card>
  );
}
