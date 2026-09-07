"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ReservationFormDialog,
  type BookingSaveMode,
} from "@/features/admin/components/reservations/ReservationFormDialog";
import { emptyReservationForm } from "@/features/admin/components/ReservationFormFields";
import {
  bookAppointmentSlot,
  bookOpenSlotMatchingStartsAt,
  releaseAppointmentSlot,
} from "@/services/clinic_schedule";
import {
  createReservation,
  updateReservation,
} from "@/services/reservations/mutations";
import {
  decodePatientKey,
  findPatientGroupByPhone,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import {
  buildStartsAt,
  reservationFormSchema,
  type ReservationFormValues,
} from "@/services/reservations/schemas";
import { listReservations } from "@/services/reservations/queries";
import { isUpcomingReservation } from "@/services/reservations/stats";
import type { Reservation } from "@/services/reservations/types";
import { listPublishedServices } from "@/services/services/queries";
import type { Service } from "@/services/services/types";
import { QuickBookContext } from "./QuickBookContext";
import type { QuickBookPrefill } from "./quickBookTypes";

type Props = { children: ReactNode };

function nextUpcomingForPhone(
  rows: Reservation[],
  phone: string,
): Reservation | null {
  if (!phone.trim()) return null;
  const group = findPatientGroupByPhone(
    groupReservationsByPatient(rows),
    phone,
  );
  if (!group) return null;
  const upcoming = group.visits
    .filter((v) => isUpcomingReservation(v))
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return upcoming[0] ?? null;
}

export function QuickBookProvider({ children }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ReservationFormValues>(emptyReservationForm());
  const [pending, setPending] = useState(false);
  const [waConversationId, setWaConversationId] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [saveMode, setSaveMode] = useState<BookingSaveMode>("new");
  const [replaceTarget, setReplaceTarget] = useState<Reservation | null>(null);

  const loadCatalog = useCallback(async () => {
    try {
      const [nextServices, nextReservations] = await Promise.all([
        listPublishedServices(),
        listReservations(),
      ]);
      setServices(nextServices);
      setReservations(nextReservations);
      return nextReservations;
    } catch {
      toast.error("Could not load booking form");
      return [] as Reservation[];
    }
  }, []);

  const syncReplaceTarget = useCallback(
    (rows: Reservation[], phone: string) => {
      const target = nextUpcomingForPhone(rows, phone);
      setReplaceTarget(target);
      setSaveMode(target ? "replace" : "new");
    },
    [],
  );

  const openQuickBook = useCallback(
    (prefill?: QuickBookPrefill) => {
      setWaConversationId(prefill?.waConversationId ?? null);
      const nextForm = {
        ...emptyReservationForm(),
        patient_name: prefill?.name?.trim() || "",
        phone: prefill?.phone?.trim() || "",
        date: prefill?.date ?? emptyReservationForm().date,
      };
      setForm(nextForm);
      setReplaceTarget(null);
      setSaveMode("new");
      setOpen(true);
      void loadCatalog().then((rows) => {
        let phone = nextForm.phone;
        if (prefill?.patientKey || prefill?.phone || prefill?.name) {
          const groups = groupReservationsByPatient(rows);
          const group =
            (prefill.patientKey
              ? getPatientGroup(groups, prefill.patientKey) ||
                getPatientGroup(groups, decodePatientKey(prefill.patientKey))
              : null) ??
            (prefill.phone
              ? findPatientGroupByPhone(groups, prefill.phone)
              : null);
          if (group) {
            phone = group.phone || phone;
            setForm((prev) => ({
              ...prev,
              patient_name: group.displayName || prev.patient_name,
              phone: group.phone || prev.phone,
              email: group.email ?? prev.email,
            }));
          }
        }
        syncReplaceTarget(rows, phone);
      });
    },
    [loadCatalog, syncReplaceTarget],
  );

  function onFormChange(next: ReservationFormValues) {
    setForm(next);
    if (next.phone !== form.phone) {
      syncReplaceTarget(reservations, next.phone);
    }
  }

  async function save() {
    const parsed = reservationFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return;
    }
    setPending(true);
    try {
      const groups = groupReservationsByPatient(reservations);
      const matched = findPatientGroupByPhone(groups, parsed.data.phone);
      const payload = {
        patient_name: matched?.displayName || parsed.data.patient_name,
        phone: matched?.phone || parsed.data.phone,
        email: parsed.data.email || matched?.email || null,
        service_id: parsed.data.service_id ?? null,
        service_label: parsed.data.service_label,
        starts_at: buildStartsAt(parsed.data.date, parsed.data.time),
        notes: parsed.data.notes ?? "",
        status: parsed.data.status,
      };

      let row: Reservation;
      if (saveMode === "replace" && replaceTarget) {
        if (replaceTarget.starts_at !== payload.starts_at) {
          await releaseAppointmentSlot(replaceTarget.id);
        }
        row = await updateReservation(replaceTarget.id, payload);
        if (parsed.data.slot_id) {
          await bookAppointmentSlot({
            slotId: parsed.data.slot_id,
            reservationId: row.id,
          });
        } else {
          await bookOpenSlotMatchingStartsAt({
            startsAtIso: payload.starts_at,
            reservationId: row.id,
          });
        }
        setReservations((prev) =>
          prev.map((item) => (item.id === row.id ? row : item)),
        );
        toast.success("Reservation updated");
      } else {
        row = await createReservation(payload);
        if (parsed.data.slot_id) {
          await bookAppointmentSlot({
            slotId: parsed.data.slot_id,
            reservationId: row.id,
          });
        } else {
          await bookOpenSlotMatchingStartsAt({
            startsAtIso: payload.starts_at,
            reservationId: row.id,
          });
        }
        setReservations((prev) => [...prev, row]);
        toast.success(
          matched
            ? `Reservation created for existing patient (${matched.phone})`
            : "Reservation created",
        );
      }

      if (waConversationId) {
        const when = new Date(payload.starts_at).toLocaleString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
        const text = [
          "Your appointment is confirmed ✅",
          `• Service: ${payload.service_label}`,
          `• When: ${when}`,
          "",
          "See you at The Dental Lounge.",
        ].join("\n");
        try {
          const res = await fetch("/api/v1/whatsapp/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ conversationId: waConversationId, text }),
          });
          if (!res.ok) throw new Error("send failed");
          toast.success("Confirmation sent on WhatsApp");
        } catch {
          toast.error("Reservation saved, but WhatsApp confirmation failed");
        }
      }

      setOpen(false);
      setWaConversationId(null);
      setReplaceTarget(null);
      setSaveMode("new");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not create reservation",
      );
    } finally {
      setPending(false);
    }
  }

  const api = useMemo(() => ({ openQuickBook }), [openQuickBook]);

  return (
    <QuickBookContext.Provider value={api}>
      {children}
      <ReservationFormDialog
        open={open}
        values={form}
        services={services}
        reservations={reservations}
        pending={pending}
        replaceTarget={replaceTarget}
        saveMode={saveMode}
        onSaveModeChange={setSaveMode}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setWaConversationId(null);
            setReplaceTarget(null);
            setSaveMode("new");
          }
        }}
        onChange={onFormChange}
        onSave={() => void save()}
      />
    </QuickBookContext.Provider>
  );
}
