"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  emptyReservationForm,
  ReservationFormFields,
  reservationToForm,
} from "@/features/admin/components/ReservationFormFields";
import {
  buildStartsAt,
  reservationFormSchema,
  type ReservationFormValues,
} from "@/services/reservations/schemas";
import {
  createReservation,
  updateReservation,
} from "@/services/reservations/mutations";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import type { PatientGroup } from "@/services/reservations/patientHistory";
import type { TreatmentItem } from "@/services/patient_treatments";
import { getReservation } from "@/services/reservations/queries";
import { SideDrawer } from "./SideDrawer";

type Props = {
  open: boolean;
  mode: "book" | "replace";
  group: PatientGroup;
  services: Service[];
  treatment: TreatmentItem | null;
  onClose: () => void;
  onBooked: (treatmentId: string, reservation: Reservation) => void;
};

export function TreatmentBookDrawer({
  open,
  mode,
  group,
  services,
  treatment,
  onClose,
  onBooked,
}: Props) {
  const [form, setForm] = useState<ReservationFormValues>(emptyReservationForm());
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open || !treatment) return;
    let cancelled = false;

    async function hydrate() {
      if (mode === "replace" && treatment?.reservationId) {
        const existing = await getReservation(treatment.reservationId);
        if (cancelled) return;
        if (existing) {
          setForm(reservationToForm(existing));
          return;
        }
      }
      setForm({
        ...emptyReservationForm(),
        patient_name: group.displayName,
        phone: group.phone,
        email: group.email ?? "",
        service_label: `Treatment: ${treatment!.toothName}`,
        notes: `Required treatment · ${treatment!.severity} · ${treatment!.toothName}`,
        status: "confirmed",
      });
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [open, treatment, group, mode]);

  async function submit() {
    const parsed = reservationFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid appointment");
      return;
    }
    if (!treatment) return;
    setPending(true);
    try {
      const payload = {
        patient_name: parsed.data.patient_name,
        phone: parsed.data.phone,
        email: parsed.data.email || null,
        service_id: parsed.data.service_id ?? null,
        service_label: parsed.data.service_label,
        starts_at: buildStartsAt(parsed.data.date, parsed.data.time),
        notes: parsed.data.notes ?? "",
        status: parsed.data.status,
      };

      let reservation: Reservation;
      if (mode === "replace" && treatment.reservationId) {
        reservation = await updateReservation(treatment.reservationId, payload);
        toast.success("Appointment replaced");
      } else {
        reservation = await createReservation(payload);
        toast.success("Appointment booked");
      }
      onBooked(treatment.id, reservation);
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setPending(false);
    }
  }

  const title =
    mode === "replace"
      ? `Replace · ${treatment?.toothName ?? "appointment"}`
      : treatment
        ? `Book · ${treatment.toothName}`
        : "Book appointment";

  return (
    <SideDrawer open={open} title={title} onClose={onClose}>
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          <ReservationFormFields
            values={form}
            services={services}
            pending={pending}
            onChange={setForm}
          />
        </div>
        <div className="flex gap-2 p-5">
          <Button type="button" disabled={pending} onClick={() => void submit()}>
            {pending
              ? mode === "replace"
                ? "Replacing…"
                : "Booking…"
              : mode === "replace"
                ? "Replace appointment"
                : "Confirm appointment"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </SideDrawer>
  );
}
