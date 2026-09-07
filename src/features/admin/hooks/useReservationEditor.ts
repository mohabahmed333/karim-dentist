"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  buildStartsAt,
  reservationFormSchema,
} from "@/services/reservations/schemas";
import {
  createReservation,
  softDeleteReservation,
  updateReservation,
} from "@/services/reservations/mutations";
import {
  bookAppointmentSlot,
  bookOpenSlotMatchingStartsAt,
  releaseAppointmentSlot,
} from "@/services/clinic_schedule";
import {
  decodePatientKey,
  findPatientGroupByPhone,
  getPatientGroup,
  groupReservationsByPatient,
} from "@/services/reservations/patientHistory";
import { filterReservationsByStatus } from "@/services/reservations/stats";
import type { Reservation } from "@/services/reservations/types";
import {
  emptyReservationForm,
  reservationToForm,
} from "@/features/admin/components/ReservationFormFields";

export type ReservationFilter = "upcoming" | "today" | "pending" | "all";

export function useReservationEditor(initial: Reservation[]) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<ReservationFilter>("upcoming");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(emptyReservationForm());
  const [pending, setPending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function reservationsUrl(
    patch: Record<string, string | null>,
  ): string {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    return qs ? `/admin/reservations?${qs}` : "/admin/reservations";
  }

  useEffect(() => {
    setItems(initial);
  }, [initial]);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setSelectedId("new");
      const date = searchParams.get("date");
      setForm({
        ...emptyReservationForm(),
        date: date ?? emptyReservationForm().date,
      });
      return;
    }
    const selected = searchParams.get("selected");
    if (selected) {
      const row = items.find((item) => item.id === selected);
      if (row) {
        setSelectedId(row.id);
        setForm(reservationToForm(row));
      }
      return;
    }
    // URL cleared (e.g. after create) — keep dialog closed
    setSelectedId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync open/close from URL only
  }, [searchParams]);

  // Prefill new appointment from Front desk / patient links — prefer existing reservation phone
  useEffect(() => {
    if (searchParams.get("new") !== "1") return;

    const groups = groupReservationsByPatient(items);
    const encoded = searchParams.get("patient");
    const phoneParam = searchParams.get("phone");
    const nameParam = searchParams.get("name");
    const date = searchParams.get("date");

    let group =
      (encoded
        ? getPatientGroup(groups, decodePatientKey(encoded))
        : null) ??
      (phoneParam ? findPatientGroupByPhone(groups, phoneParam) : null);

    if (group) {
      setForm((prev) => ({
        ...prev,
        patient_name: group.displayName,
        phone: group.phone,
        email: group.email ?? "",
        date: date ?? prev.date,
      }));
      return;
    }

    if (!phoneParam && !nameParam) return;
    setForm((prev) => ({
      ...prev,
      phone: phoneParam?.trim() || prev.phone,
      patient_name: nameParam?.trim() || prev.patient_name,
      date: date ?? prev.date,
    }));
  }, [searchParams, items]);

  // Keep edit form in sync if the list refreshes while a row is selected
  useEffect(() => {
    if (searchParams.get("new") === "1") return;
    const selected = searchParams.get("selected");
    if (!selected) return;
    const row = items.find((item) => item.id === selected);
    if (row) {
      setSelectedId(row.id);
      setForm(reservationToForm(row));
    }
  }, [items, searchParams]);

  const rows = useMemo(
    () => filterReservationsByStatus(items, filter),
    [items, filter],
  );

  function openRow(id: string) {
    const row = items.find((item) => item.id === id);
    if (!row) return;
    setSelectedId(id);
    setForm(reservationToForm(row));
    router.replace(
      reservationsUrl({ selected: id, new: null }),
    );
  }

  function openNew(dateIso?: string) {
    setSelectedId("new");
    setForm({
      ...emptyReservationForm(),
      date: dateIso ?? emptyReservationForm().date,
    });
    router.replace(
      reservationsUrl({
        new: "1",
        selected: null,
        wa: null,
        phone: null,
        name: null,
        date: dateIso ?? searchParams.get("date"),
      }),
    );
  }

  function closeDialog() {
    setSelectedId(null);
    setDeleteOpen(false);
    router.replace(
      reservationsUrl({
        selected: null,
        new: null,
        wa: null,
        phone: null,
        name: null,
      }),
    );
  }

  function upsertItem(row: Reservation) {
    setItems((prev) => {
      const exists = prev.some((item) => item.id === row.id);
      const next = exists
        ? prev.map((item) => (item.id === row.id ? row : item))
        : [...prev, row];
      return next.sort((a, b) => a.starts_at.localeCompare(b.starts_at));
    });
  }

  async function saveReservation(): Promise<boolean> {
    const parsed = reservationFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
      return false;
    }
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
      if (selectedId === "new") {
        const matched = findPatientGroupByPhone(
          groupReservationsByPatient(items),
          payload.phone,
        );
        const createPayload = matched
          ? {
              ...payload,
              phone: matched.phone,
              patient_name: matched.displayName || payload.patient_name,
              email: payload.email || matched.email,
            }
          : payload;

        const row = await createReservation(createPayload);
        if (parsed.data.slot_id) {
          await bookAppointmentSlot({
            slotId: parsed.data.slot_id,
            reservationId: row.id,
          });
        } else {
          await bookOpenSlotMatchingStartsAt({
            startsAtIso: createPayload.starts_at,
            reservationId: row.id,
          });
        }
        upsertItem(row);
        toast.success(
          matched
            ? `Reservation created for existing patient (${matched.phone})`
            : "Reservation created",
        );

        const waConversationId = searchParams.get("wa");
        if (waConversationId) {
          const when = new Date(createPayload.starts_at).toLocaleString(
            undefined,
            {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            },
          );
          const text = [
            "Your appointment is confirmed ✅",
            `• Service: ${createPayload.service_label}`,
            `• When: ${when}`,
            "",
            "See you at The Dental Lounge.",
          ].join("\n");
          try {
            const res = await fetch("/api/v1/whatsapp/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                conversationId: waConversationId,
                text,
              }),
            });
            if (!res.ok) throw new Error("send failed");
            toast.success("Confirmation sent on WhatsApp");
          } catch {
            toast.error(
              "Reservation saved, but WhatsApp confirmation failed",
            );
          }
          router.push("/admin/support");
          return true;
        }

        closeDialog();
        return true;
      }
      if (selectedId) {
        const prev = items.find((item) => item.id === selectedId);
        if (prev && prev.starts_at !== payload.starts_at) {
          await releaseAppointmentSlot(selectedId);
        }
        const row = await updateReservation(selectedId, payload);
        if (parsed.data.slot_id) {
          await bookAppointmentSlot({
            slotId: parsed.data.slot_id,
            reservationId: row.id,
          });
        } else if (prev && prev.starts_at !== payload.starts_at) {
          await bookOpenSlotMatchingStartsAt({
            startsAtIso: payload.starts_at,
            reservationId: row.id,
          });
        }
        upsertItem(row);
        setForm(reservationToForm(row));
        toast.success("Reservation saved");
        return true;
      }
      return false;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function setStatus(status: Reservation["status"]) {
    if (!selectedId || selectedId === "new") return;
    setPending(true);
    try {
      const row = await updateReservation(selectedId, { status });
      setItems((prev) => prev.map((item) => (item.id === row.id ? row : item)));
      setForm(reservationToForm(row));
      toast.success(`Marked ${status}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setPending(false);
    }
  }

  async function confirmDelete() {
    if (!selectedId || selectedId === "new") return;
    setPending(true);
    try {
      await releaseAppointmentSlot(selectedId);
      await softDeleteReservation(selectedId);
      setItems((prev) => prev.filter((item) => item.id !== selectedId));
      setSelectedId(null);
      setDeleteOpen(false);
      router.replace(reservationsUrl({ selected: null, new: null }));
      toast.success("Reservation deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setPending(false);
    }
  }

  return {
    items,
    upsertItem,
    rows,
    filter,
    setFilter,
    selectedId,
    form,
    setForm,
    pending,
    deleteOpen,
    setDeleteOpen,
    openRow,
    openNew,
    closeDialog,
    saveReservation,
    setStatus,
    confirmDelete,
  };
}
