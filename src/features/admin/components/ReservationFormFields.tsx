"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReservationFormValues } from "@/services/reservations/schemas";
import { RESERVATION_STATUSES } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import {
  getClinicHours,
  listOpenAppointmentSlots,
  regenerateOpenSlots,
} from "@/services/clinic_schedule";
import { Label } from "@/components/ui/label";
import { AdminInput, AdminNativeSelect, AdminTextarea } from "@/features/admin/ui";
import { useTranslations } from "@/lib/i18n";
import {
  GENERAL_CONSULTATION_LABEL_EN,
  persistServiceLabel,
} from "@/features/admin/lib/serviceDisplayName";
import {
  SERVICE_PICKER_CONSULT_VALUE,
  ServicePicker,
} from "@/features/admin/components/ServicePicker";

type Props = {
  values: ReservationFormValues;
  services: Service[];
  pending: boolean;
  onChange: (values: ReservationFormValues) => void;
};

type SlotDto = { id: string; starts_at: string; ends_at?: string };

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function timeKey(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function formatDayLabel(isoOrDay: string): string {
  const d = isoOrDay.includes("T")
    ? new Date(isoOrDay)
    : new Date(`${isoOrDay}T12:00:00`);
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

async function fetchSlotsFromApi(): Promise<SlotDto[]> {
  const fromIso = new Date().toISOString();
  const toIso = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
  const res = await fetch(
    `/api/v1/booking/slots?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`,
  );
  const body = (await res.json()) as { slots?: SlotDto[]; error?: string };
  if (!res.ok || body.error) throw new Error(body.error ?? "Failed to load slots");
  return body.slots ?? [];
}

async function loadOpenSlots(): Promise<SlotDto[]> {
  let slots = await fetchSlotsFromApi().catch(() => [] as SlotDto[]);
  if (slots.length > 0) return slots;

  // Clinic hours exist but slots table empty — regenerate via admin API.
  const regen = await fetch("/api/v1/booking/slots/regenerate", {
    method: "POST",
  })
    .then(async (res) => {
      const body = (await res.json()) as {
        slots?: SlotDto[];
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? "Could not generate slots");
      return body.slots ?? [];
    })
    .catch(async (err) => {
      // Fallback: client-side regenerate (requires admin session)
      try {
        const hours = await getClinicHours();
        await regenerateOpenSlots(hours);
        const fromIso = new Date().toISOString();
        const toIso = new Date(
          Date.now() + 21 * 24 * 60 * 60 * 1000,
        ).toISOString();
        const rows = await listOpenAppointmentSlots({ fromIso, toIso });
        return rows.map((r) => ({
          id: r.id,
          starts_at: r.starts_at,
          ends_at: r.ends_at,
        }));
      } catch {
        throw err instanceof Error ? err : new Error("Could not generate slots");
      }
    });

  return regen;
}

export function ReservationFormFields({
  values,
  services,
  pending,
  onChange,
}: Props) {
  const t = useTranslations();
  const [slots, setSlots] = useState<SlotDto[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setSlotsLoading(true);
    setSlotsError(null);
    void loadOpenSlots()
      .then((rows) => {
        if (!alive) return;
        setSlots(rows);
        if (rows.length === 0) {
          setSlotsError(
            "No open clinic slots. Save clinic hours in Settings to generate dates.",
          );
        }
      })
      .catch((err) => {
        if (!alive) return;
        setSlots([]);
        setSlotsError(
          err instanceof Error ? err.message : "Could not load slots",
        );
      })
      .finally(() => {
        if (alive) setSlotsLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const dates = useMemo(() => {
    const byDay = new Map<string, string>();
    for (const slot of slots) {
      const day = dayKey(slot.starts_at);
      if (!byDay.has(day)) byDay.set(day, formatDayLabel(slot.starts_at));
    }
    if (values.date && !byDay.has(values.date)) {
      byDay.set(values.date, formatDayLabel(values.date));
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, label]) => ({ value, label }));
  }, [slots, values.date]);

  const daySlots = useMemo(
    () => slots.filter((s) => dayKey(s.starts_at) === values.date),
    [slots, values.date],
  );

  function patch(partial: Partial<ReservationFormValues>) {
    onChange({ ...values, ...partial });
  }

  function onServiceChange(serviceValue: string) {
    if (serviceValue === SERVICE_PICKER_CONSULT_VALUE) {
      patch({
        service_id: null,
        service_label: GENERAL_CONSULTATION_LABEL_EN,
      });
      return;
    }
    const service = services.find((item) => item.id === serviceValue);
    patch({
      service_id: service?.id ?? null,
      service_label: persistServiceLabel(service),
    });
  }

  function onSlotPick(slotId: string) {
    const slot = slots.find((s) => s.id === slotId);
    if (!slot) return;
    patch({
      slot_id: slot.id,
      date: dayKey(slot.starts_at),
      time: timeKey(slot.starts_at),
    });
  }

  const serviceValue =
    values.service_id ??
    (values.service_label &&
    values.service_label !== GENERAL_CONSULTATION_LABEL_EN
      ? ""
      : SERVICE_PICKER_CONSULT_VALUE);

  const selectedSlotId =
    values.slot_id ??
    daySlots.find(
      (s) =>
        dayKey(s.starts_at) === values.date &&
        timeKey(s.starts_at) === values.time,
    )?.id ??
    "";

  const fieldsDisabled = pending || slotsLoading;

  return (
    <form id="reservation-form" className="space-y-4">
      {slotsError ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900">
          {slotsError}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2">
          <Label htmlFor="patient_name">{t("admin.reservations.patientName")}</Label>
          <AdminInput
            id="patient_name"
            data-showreel-action="reservation-patient-name"
            value={values.patient_name}
            disabled={pending}
            onChange={(event) => patch({ patient_name: event.target.value })}
          />
        </label>
        <label className="grid gap-2">
          <Label htmlFor="phone">{t("admin.reservations.phone")}</Label>
          <AdminInput
            id="phone"
            data-showreel-action="reservation-phone"
            value={values.phone}
            disabled={pending}
            onChange={(event) => patch({ phone: event.target.value })}
          />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <Label htmlFor="email">{t("admin.reservations.email")}</Label>
          <AdminInput
            id="email"
            type="email"
            value={values.email ?? ""}
            disabled={pending}
            onChange={(event) => patch({ email: event.target.value })}
          />
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <Label htmlFor="service">{t("admin.reservations.service")}</Label>
          <ServicePicker
            id="service"
            services={services}
            value={serviceValue || SERVICE_PICKER_CONSULT_VALUE}
            disabled={pending}
            onChange={onServiceChange}
          />
        </label>
        <label className="grid gap-2">
          <Label htmlFor="date">{t("admin.reservations.date")}</Label>
          <AdminNativeSelect
            id="date"
            value={values.date}
            disabled={fieldsDisabled}
            onChange={(event) =>
              patch({ date: event.target.value, time: "", slot_id: null })
            }
          >
            <option value="">
              {slotsLoading
                ? "Loading dates…"
                : dates.length
                  ? "Select date"
                  : "No dates available"}
            </option>
            {dates.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </AdminNativeSelect>
        </label>
        <label className="grid gap-2">
          <Label htmlFor="slot">{t("admin.reservations.openSlot")}</Label>
          <AdminNativeSelect
            id="slot"
            value={selectedSlotId}
            disabled={fieldsDisabled || !values.date}
            onChange={(event) => onSlotPick(event.target.value)}
          >
            <option value="">
              {slotsLoading
                ? "Loading slots…"
                : values.date
                  ? daySlots.length
                    ? "Select time"
                    : "No open slots"
                  : "Pick a date"}
            </option>
            {daySlots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {timeKey(slot.starts_at)}
              </option>
            ))}
            {values.time && !selectedSlotId ? (
              <option value="">{values.time} (existing)</option>
            ) : null}
          </AdminNativeSelect>
        </label>
        <label className="grid gap-2 sm:col-span-2">
          <Label htmlFor="status">{t("admin.reservations.status")}</Label>
          <AdminNativeSelect
            id="status"
            value={values.status}
            disabled={pending}
            onChange={(event) =>
              patch({
                status: event.target.value as ReservationFormValues["status"],
              })
            }
          >
            {RESERVATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "pending"
                  ? t("admin.reservations.pending")
                  : status === "confirmed"
                    ? t("admin.reservations.confirmed")
                    : status === "cancelled"
                      ? t("admin.reservations.cancelled")
                      : status === "completed"
                        ? t("admin.reservations.completed")
                        : status === "no_show"
                          ? t("admin.reservations.noShow")
                          : status}
              </option>
            ))}
          </AdminNativeSelect>
        </label>
      </div>
      <label className="grid gap-2">
        <Label htmlFor="notes">{t("admin.reservations.notes")}</Label>
        <AdminTextarea
          id="notes"
          rows={3}
          value={values.notes ?? ""}
          disabled={pending}
          onChange={(event) => patch({ notes: event.target.value })}
        />
      </label>
    </form>
  );
}

export function emptyReservationForm(): ReservationFormValues {
  return {
    patient_name: "",
    phone: "",
    email: "",
    service_id: null,
    service_label: GENERAL_CONSULTATION_LABEL_EN,
    date: "",
    time: "",
    slot_id: null,
    notes: "",
    status: "pending",
  };
}

export function reservationToForm(
  reservation: import("@/services/reservations/types").Reservation,
): ReservationFormValues {
  const starts = new Date(reservation.starts_at);
  const date = `${starts.getFullYear()}-${String(starts.getMonth() + 1).padStart(2, "0")}-${String(starts.getDate()).padStart(2, "0")}`;
  const hours = String(starts.getHours()).padStart(2, "0");
  const minutes = String(starts.getMinutes()).padStart(2, "0");
  return {
    patient_name: reservation.patient_name,
    phone: reservation.phone,
    email: reservation.email ?? "",
    service_id: reservation.service_id,
    service_label: reservation.service_label,
    date,
    time: `${hours}:${minutes}`,
    slot_id: null,
    notes: reservation.notes,
    status: reservation.status,
  };
}
