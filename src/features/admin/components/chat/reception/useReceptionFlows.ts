"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { ClinicChatAction } from "@/services/clinic_chat";
import {
  listOpenAppointmentSlots,
  bookAppointmentSlot,
} from "@/services/clinic_schedule";
import {
  getPatientProfile,
  upsertPatientProfile,
} from "@/services/patient_profiles";
import {
  createReservation,
  listReservations,
  updateReservation,
  buildStartsAt,
} from "@/services/reservations";
import { listPublishedServices } from "@/services/services";
import { useTranslations } from "@/lib/i18n";
import {
  getNoteStamps,
  getStartActions,
  patientScopedActions,
  type ActivePatient,
  type BookDraft,
  type NoteDraft,
  type ReceptionDraft,
} from "./flowTypes";
import type { BookPollOption } from "./BookBookingPanel";
import {
  bookChoiceActions,
  shouldOfferBookChoice,
} from "./bookChoice";
import {
  dayKey,
  findOpenReservationForPatient,
  formatWhen,
  patientActionsFromReservations,
  pendingReservations,
  phoneToPatientKey,
  reservationAction,
  timeKey,
  todayReservations,
} from "./receptionHelpers";

type PushFn = (
  role: "user" | "assistant",
  content: string,
  actions?: ClinicChatAction[],
) => Promise<void>;

type Options = {
  initialPatient?: ActivePatient | null;
  onActivePatientChange?: (patient: ActivePatient | null) => void;
};

export type BookPanelState = {
  name: string;
  phone: string;
  options: BookPollOption[];
  selectedId: string | null;
};

const emptyDraft = (active?: ActivePatient | null): ReceptionDraft => ({
  book: {},
  note: {},
  activePatient: active ?? undefined,
});

function timeActionsForDate(
  date: string,
  daySlots: { id: string; starts_at: string }[],
): ClinicChatAction[] {
  return daySlots.map((s) => ({
    id: "book:slot",
    label: timeKey(s.starts_at),
    payload: {
      time: timeKey(s.starts_at),
      slotId: s.id,
      date,
    },
  }));
}

function toActive(p: Record<string, string>): ActivePatient | null {
  if (!p.patientKey || !p.name) return null;
  const noteCount = p.noteCount ? Number(p.noteCount) : undefined;
  return {
    patientKey: p.patientKey,
    name: p.name,
    phone: p.phone ?? "",
    href: p.href,
    lastReservationId: p.reservationId || undefined,
    noteCount:
      noteCount !== undefined && Number.isFinite(noteCount)
        ? noteCount
        : undefined,
  };
}

export function useReceptionFlows(push: PushFn, options: Options = {}) {
  const t = useTranslations();
  const { initialPatient = null, onActivePatientChange } = options;
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<ReceptionDraft>(() =>
    emptyDraft(initialPatient),
  );
  const [bookPanel, setBookPanel] = useState<BookPanelState | null>(null);
  const draftRef = useRef(draft);
  const bookPanelRef = useRef(bookPanel);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);
  useEffect(() => {
    bookPanelRef.current = bookPanel;
  }, [bookPanel]);

  useEffect(() => {
    if (!initialPatient) return;
    setDraft((d) =>
      d.activePatient?.patientKey === initialPatient.patientKey
        ? d
        : { ...d, activePatient: initialPatient },
    );
  }, [initialPatient]);

  const remember = useCallback(
    (patient: ActivePatient) => {
      setDraft((d) => {
        const next = { ...d, activePatient: patient };
        draftRef.current = next;
        return next;
      });
      onActivePatientChange?.(patient);
    },
    [onActivePatientChange],
  );

  const nextActions = useCallback(async (): Promise<ClinicChatAction[]> => {
    const active = draftRef.current.activePatient;
    if (!active) return getStartActions(t);
    try {
      const rows = await listReservations();
      const open = findOpenReservationForPatient(rows, {
        patientKey: active.patientKey,
        phone: active.phone,
      });
      const hydrated: ActivePatient = {
        ...active,
        lastReservationId: open?.id,
      };
      if (hydrated.lastReservationId !== active.lastReservationId) {
        remember(hydrated);
      }
      return patientScopedActions(hydrated, t);
    } catch {
      return patientScopedActions(active, t);
    }
  }, [remember, t]);

  const run = useCallback(
    async (fn: () => Promise<void>) => {
      if (busy) return;
      setBusy(true);
      try {
        await fn();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("admin.chat.toast.actionFailed"));
        await push(
          "assistant",
          err instanceof Error ? err.message : t("admin.chat.toast.actionFailed"),
          await nextActions(),
        );
      } finally {
        setBusy(false);
      }
    },
    [busy, nextActions, push, t],
  );

  const openBookPanel = useCallback(
    async (seed: { name?: string; phone?: string; patientKey?: string }) => {
      const services = await listPublishedServices();
      const options: BookPollOption[] = services.map((s) => ({
        id: s.id,
        label: s.title,
        serviceId: s.id,
        serviceLabel: s.title,
      }));
      const general = t("admin.chat.generalConsultation");
      if (!options.some((o) => o.serviceLabel === general || o.serviceLabel === "General consultation")) {
        options.unshift({
          id: "general-consultation",
          label: general,
          serviceId: "",
          serviceLabel: general,
        });
      }
      const name = seed.name?.trim() ?? "";
      const phone = seed.phone?.trim() ?? "";
      setDraft((d) => ({
        ...d,
        book: {
          patientKey: seed.patientKey,
          name: name || undefined,
          phone: phone || undefined,
        },
      }));
      setBookPanel({
        name,
        phone,
        options,
        selectedId: null,
      });
      await push(
        "assistant",
        t("admin.chat.msg.enterNamePhone"),
      );
    },
    [push, t],
  );

  const offerSlots = useCallback(
    async (book: BookDraft) => {
      let slots: { id: string; starts_at: string }[] = [];
      try {
        slots = await listOpenAppointmentSlots({
          fromIso: new Date().toISOString(),
        });
      } catch {
        slots = [];
      }
      const dates = [
        ...new Set(slots.map((s) => dayKey(s.starts_at))),
      ].slice(0, 10);
      if (dates.length === 0) {
        await push(
          "assistant",
          t("admin.chat.msg.serviceNoSlots").replace(
            "{service}",
            book.serviceLabel ?? "",
          ),
          await nextActions(),
        );
        return;
      }
      await push(
        "assistant",
        t("admin.chat.msg.servicePickDay").replace(
          "{service}",
          book.serviceLabel ?? "",
        ),
        dates.map((d) => ({
          id: "book:date",
          label: d,
          payload: { date: d },
        })),
      );
    },
    [nextActions, push, t],
  );

  const offerNoteStamps = useCallback(
    async (note: NoteDraft) => {
      await push(
        "assistant",
        t("admin.chat.msg.noteFor").replace("{name}", note.name ?? ""),
        getNoteStamps(t).map((label) => ({
          id: "note:stamp",
          label,
          payload: { stamp: label },
        })),
      );
    },
    [push, t],
  );

  const startBook = useCallback(async () => {
    const active = draftRef.current.activePatient;
    await openBookPanel({
      name: active?.name,
      phone: active?.phone,
      patientKey: active?.patientKey,
    });
  }, [openBookPanel]);

  const startToday = useCallback(async () => {
    const rows = todayReservations(await listReservations());
    if (rows.length === 0) {
      await push("assistant", t("admin.chat.msg.nothingToday"), await nextActions());
      return;
    }
    await push(
      "assistant",
      rows.length === 1
        ? t("admin.chat.msg.todayVisitOne").replace("{count}", "1")
        : t("admin.chat.msg.todayVisits").replace("{count}", String(rows.length)),
      rows.map((r) => reservationAction("today", r)),
    );
  }, [nextActions, push, t]);

  const startPending = useCallback(async () => {
    const rows = pendingReservations(await listReservations());
    if (rows.length === 0) {
      await push("assistant", t("admin.chat.msg.noPending"), await nextActions());
      return;
    }
    await push(
      "assistant",
      t("admin.chat.msg.pendingPick"),
      rows.map((r) => reservationAction("pending-pick", r)),
    );
  }, [nextActions, push, t]);

  const startNoshow = useCallback(async () => {
    const rows = todayReservations(await listReservations()).filter(
      (r) => r.status === "confirmed" || r.status === "pending",
    );
    if (rows.length === 0) {
      await push("assistant", t("admin.chat.msg.noNoshow"), await nextActions());
      return;
    }
    await push(
      "assistant",
      t("admin.chat.msg.markNoshow"),
      rows.map((r) =>
        reservationAction("noshow", r, t("admin.chat.msg.noshowChip").replace("{name}", r.patient_name)),
      ),
    );
  }, [nextActions, push, t]);

  const startPatient = useCallback(async () => {
    const rows = await listReservations();
    const actions = patientActionsFromReservations(rows, t("admin.chat.action.newPatient"))
      .filter((a) => a.id === "book:patient")
      .map((a) => ({ ...a, id: "patient:open" }));
    await push(
      "assistant",
      t("admin.chat.msg.pickPatient"),
      actions,
    );
  }, [push, t]);

  const startNote = useCallback(async () => {
    const active = draftRef.current.activePatient;
    if (active) {
      const note: NoteDraft = {
        patientKey: active.patientKey,
        name: active.name,
        phone: active.phone,
      };
      setDraft((d) => ({ ...d, note }));
      await offerNoteStamps(note);
      return;
    }
    setDraft((d) => ({ ...d, note: {} }));
    const rows = await listReservations();
    await push(
      "assistant",
      t("admin.chat.msg.noteWhich"),
      patientActionsFromReservations(rows, t("admin.chat.action.newPatient"))
        .filter((a) => a.id === "book:patient")
        .map((a) => ({ ...a, id: "note:patient" })),
    );
  }, [offerNoteStamps, push, t]);

  const handleAction = useCallback(
    (action: ClinicChatAction) =>
      run(async () => {
        const id = action.id;
        const p = action.payload ?? {};
        const current = draftRef.current;

        if (id === "start:book") {
          await push("user", t("admin.chat.action.book"));
          const active = draftRef.current.activePatient;
          if (shouldOfferBookChoice(active)) {
            await push(
              "assistant",
              t("admin.chat.msg.bookChoice"),
              bookChoiceActions(t),
            );
            return;
          }
          await startBook();
          return;
        }
        if (id === "start:today") {
          await push("user", t("admin.chat.action.today"));
          await startToday();
          return;
        }
        if (id === "start:pending") {
          await push("user", t("admin.chat.action.pending"));
          await startPending();
          return;
        }
        if (id === "start:noshow") {
          await push("user", t("admin.chat.action.noshow"));
          await startNoshow();
          return;
        }
        if (id === "start:patient") {
          await push("user", t("admin.chat.action.findPatient"));
          await startPatient();
          return;
        }
        if (id === "start:note") {
          await push("user", t("admin.chat.action.note"));
          await startNote();
          return;
        }
        if (id === "start:website") {
          await push("user", t("admin.chat.action.website"));
          await push("assistant", t("admin.chat.msg.websiteHelp"), await nextActions());
          return;
        }
        if (id === "start:chart") {
          await push("user", t("admin.chat.action.chart"));
          await push("assistant", t("admin.chat.msg.chartHelp"), await nextActions());
          return;
        }
        if (id === "start:clinical") {
          await push("user", t("admin.chat.action.clinical"));
          await push("assistant", t("admin.chat.msg.clinicalHelp"), await nextActions());
          return;
        }

        if (id === "patient:book") {
          const fromPayload = toActive(p);
          const currentPatient = current.activePatient;
          let patient: ActivePatient | null = fromPayload
            ? {
                ...currentPatient,
                ...fromPayload,
                lastReservationId:
                  p.reservationId ||
                  fromPayload.lastReservationId ||
                  currentPatient?.lastReservationId,
                noteCount: currentPatient?.noteCount ?? fromPayload.noteCount,
              }
            : (currentPatient ?? null);

          // Always check reservations API for an open booking.
          let reservationId =
            p.reservationId || patient?.lastReservationId || undefined;
          if (patient) {
            try {
              const rows = await listReservations();
              const open = findOpenReservationForPatient(rows, {
                patientKey: patient.patientKey,
                phone: patient.phone,
              });
              reservationId = open?.id ?? reservationId;
              patient = {
                ...patient,
                lastReservationId: open?.id,
              };
              remember(patient);
            } catch {
              if (patient) remember(patient);
            }
          }

          if (reservationId) {
            setDraft((d) => ({
              ...d,
              rescheduleId: reservationId,
              activePatient: patient ?? d.activePatient,
            }));
            await push(
              "user",
              t("admin.chat.msg.replaceReservationUser").replace(
                "{name}",
                patient?.name ?? t("admin.chat.patient"),
              ),
            );
            const slots = await listOpenAppointmentSlots({
              fromIso: new Date().toISOString(),
            });
            const dates = [
              ...new Set(slots.map((s) => dayKey(s.starts_at))),
            ].slice(0, 8);
            if (dates.length === 0) {
              await push(
                "assistant",
                t("admin.chat.msg.noOpenSlots"),
                await nextActions(),
              );
              return;
            }
            await push(
              "assistant",
              t("admin.chat.msg.pickNewDay"),
              dates.map((d) => ({
                id: "reschedule:date",
                label: d,
                payload: { date: d, id: reservationId },
              })),
            );
            return;
          }

          await push(
            "user",
            patient
              ? t("admin.chat.msg.bookForUser").replace("{name}", patient.name)
              : t("admin.chat.action.book"),
          );
          await openBookPanel({
            name: patient?.name ?? p.name,
            phone: patient?.phone ?? p.phone,
            patientKey: patient?.patientKey ?? p.patientKey,
          });
          return;
        }

        if (id === "patient:note") {
          const patient = toActive(p) ?? current.activePatient;
          if (!patient) {
            await startNote();
            return;
          }
          remember(patient);
          const note: NoteDraft = {
            patientKey: patient.patientKey,
            name: patient.name,
            phone: patient.phone,
          };
          setDraft((d) => ({ ...d, note, activePatient: patient }));
          await push("user", t("admin.chat.msg.noteForUser").replace("{name}", patient.name));
          await offerNoteStamps(note);
          return;
        }

        if (id === "book:new") {
          await push("user", t("admin.chat.action.newPatient"));
          await openBookPanel({ name: "", phone: "" });
          return;
        }

        if (id === "book:for-chat") {
          const active = draftRef.current.activePatient;
          await push("user", t("admin.chat.action.bookForChat"));
          await openBookPanel({
            name: active?.name,
            phone: active?.phone,
            patientKey: active?.patientKey,
          });
          return;
        }

        if (id === "book:replace") {
          const patient = draftRef.current.activePatient;
          await push("user", t("admin.chat.action.replaceReservation"));
          if (!patient) {
            await push(
              "assistant",
              t("admin.chat.msg.pickPatient"),
              await nextActions(),
            );
            return;
          }
          let reservationId = patient.lastReservationId;
          try {
            const rows = await listReservations();
            const open = findOpenReservationForPatient(rows, {
              patientKey: patient.patientKey,
              phone: patient.phone,
            });
            reservationId = open?.id ?? reservationId;
            if (open) {
              remember({
                ...patient,
                lastReservationId: open.id,
              });
            }
          } catch {
            /* keep cached id */
          }
          if (!reservationId) {
            await push(
              "assistant",
              t("admin.chat.msg.noReservationToReplace"),
              [
                {
                  id: "book:for-chat",
                  label: t("admin.chat.action.bookForChat"),
                },
              ],
            );
            return;
          }
          setDraft((d) => ({
            ...d,
            rescheduleId: reservationId,
            activePatient: patient,
          }));
          const slots = await listOpenAppointmentSlots({
            fromIso: new Date().toISOString(),
          });
          const dates = [
            ...new Set(slots.map((s) => dayKey(s.starts_at))),
          ].slice(0, 8);
          if (dates.length === 0) {
            await push(
              "assistant",
              t("admin.chat.msg.noOpenSlots"),
              await nextActions(),
            );
            return;
          }
          await push(
            "assistant",
            t("admin.chat.msg.pickNewDay"),
            dates.map((d) => ({
              id: "reschedule:date",
              label: d,
              payload: { date: d, id: reservationId },
            })),
          );
          return;
        }

        if (id === "book:patient") {
          const patient = toActive(p);
          if (patient) remember(patient);
          await push("user", p.name ?? t("admin.chat.patient"));
          await openBookPanel({
            name: p.name,
            phone: p.phone,
            patientKey: p.patientKey,
          });
          return;
        }

        if (id === "book:service") {
          // Legacy chip path — fold into panel continue
          const book = {
            ...draftRef.current.book,
            serviceId: p.serviceId || null,
            serviceLabel: p.serviceLabel,
          };
          setDraft((d) => ({ ...d, book }));
          setBookPanel(null);
          await push("user", p.serviceLabel ?? t("admin.chat.service"));
          await offerSlots(book);
          return;
        }

        if (id === "book:date") {
          const date = p.date!;
          const book = { ...draftRef.current.book, date };
          setDraft((d) => ({ ...d, book }));
          let daySlots: { id: string; starts_at: string }[] = [];
          try {
            const slots = await listOpenAppointmentSlots({
              fromIso: new Date().toISOString(),
            });
            daySlots = slots.filter((s) => dayKey(s.starts_at) === date);
          } catch {
            daySlots = [];
          }
          const timeActions = timeActionsForDate(date, daySlots);
          await push("user", date);
          if (timeActions.length === 0) {
            await push(
              "assistant",
              t("admin.chat.msg.noTimesOn").replace("{date}", date),
              await nextActions(),
            );
            return;
          }
          await push(
            "assistant",
            t("admin.chat.msg.timesOn").replace("{date}", date),
            timeActions,
          );
          return;
        }

        if (id === "book:slot") {
          const book = {
            ...draftRef.current.book,
            date: p.date ?? draftRef.current.book.date,
            time: p.time,
            slotId: p.slotId || null,
          };
          setDraft((d) => ({ ...d, book }));
          await push("user", p.time ?? t("admin.chat.slot"));
          await push(
            "assistant",
            t("admin.chat.msg.confirmBookDetail")
              .replace("{name}", book.name ?? "")
              .replace("{service}", book.serviceLabel ?? "")
              .replace("{date}", book.date ?? "")
              .replace("{time}", book.time ?? ""),
            [
              { id: "book:confirm", label: t("admin.chat.action.confirmBook"), payload: p },
              { id: "book:cancel", label: t("admin.poll.cancel") },
            ],
          );
          return;
        }

        if (id === "book:confirm") {
          const book = draftRef.current.book;
          if (
            !book.name ||
            !book.phone ||
            !book.serviceLabel ||
            !book.date ||
            !book.time ||
            !book.slotId
          ) {
            await push(
              "assistant",
              t("admin.chat.msg.missingBooking"),
              await nextActions(),
            );
            return;
          }
          const row = await createReservation({
            patient_name: book.name,
            phone: book.phone,
            service_id: book.serviceId || null,
            service_label: book.serviceLabel,
            starts_at: buildStartsAt(book.date, book.time),
            notes: "",
            status: "pending",
          });
          await bookAppointmentSlot({
            slotId: book.slotId,
            reservationId: row.id,
          });
          const key = book.patientKey ?? phoneToPatientKey(book.phone);
          const patient: ActivePatient = {
            patientKey: key,
            name: book.name,
            phone: book.phone,
            href: `/admin/patients/${encodeURIComponent(key)}`,
            lastReservationId: row.id,
            noteCount: draftRef.current.activePatient?.noteCount,
          };
          remember(patient);
          setDraft((d) => {
            const next = {
              ...d,
              book: {},
              activePatient: patient,
            };
            draftRef.current = next;
            return next;
          });
          setBookPanel(null);
          toast.success(t("admin.chat.toast.booked"));
          await push(
            "assistant",
            t("admin.chat.msg.bookedDetail")
              .replace("{name}", row.patient_name)
              .replace("{when}", formatWhen(row.starts_at))
              .replace("{patient}", patient.name),
            patientScopedActions(patient, t),
          );
          return;
        }

        if (id === "book:cancel") {
          setBookPanel(null);
          setDraft((d) => ({ ...d, book: {}, note: {} }));
          await push("assistant", t("admin.chat.msg.cancelled"), await nextActions());
          return;
        }

        if (id.startsWith("pending-pick:")) {
          const resId = id.slice("pending-pick:".length);
          await push("user", action.label);
          await push("assistant", t("admin.chat.msg.whatNext"), [
            {
              id: "pending:confirm",
              label: t("admin.chat.action.confirm"),
              payload: { id: resId },
            },
            {
              id: "pending:cancel",
              label: t("admin.chat.action.cancelBooking"),
              payload: { id: resId },
            },
            {
              id: "pending:reschedule",
              label: t("admin.chat.action.reschedule"),
              payload: { id: resId },
            },
          ]);
          return;
        }

        if (id === "pending:confirm") {
          await updateReservation(p.id!, { status: "confirmed" });
          toast.success(t("admin.chat.toast.confirmed"));
          await push("assistant", t("admin.chat.msg.markedConfirmed"), await nextActions());
          return;
        }

        if (id === "pending:cancel") {
          await updateReservation(p.id!, { status: "cancelled" });
          toast.success(t("admin.chat.toast.cancelled"));
          await push("assistant", t("admin.chat.msg.bookingCancelled"), await nextActions());
          return;
        }

        if (id === "pending:reschedule") {
          setDraft((d) => ({ ...d, rescheduleId: p.id }));
          const slots = await listOpenAppointmentSlots({
            fromIso: new Date().toISOString(),
          });
          const dates = [
            ...new Set(slots.map((s) => dayKey(s.starts_at))),
          ].slice(0, 8);
          await push("user", t("admin.chat.action.reschedule"));
          if (dates.length === 0) {
            await push(
              "assistant",
              t("admin.chat.msg.noOpenSlots"),
              await nextActions(),
            );
            return;
          }
          await push(
            "assistant",
            t("admin.chat.msg.pickNewDay"),
            dates.map((d) => ({
              id: "reschedule:date",
              label: d,
              payload: { date: d, id: p.id! },
            })),
          );
          return;
        }

        if (id === "reschedule:date") {
          const slots = await listOpenAppointmentSlots({
            fromIso: new Date().toISOString(),
          });
          const daySlots = slots.filter((s) => dayKey(s.starts_at) === p.date);
          await push("user", p.date!);
          if (daySlots.length === 0) {
            await push(
              "assistant",
              t("admin.chat.msg.noTimesOn").replace("{date}", p.date!),
              await nextActions(),
            );
            return;
          }
          await push(
            "assistant",
            t("admin.chat.msg.pickTime"),
            daySlots.map((s) => ({
              id: "reschedule:slot",
              label: timeKey(s.starts_at),
              payload: {
                id: p.id!,
                startsAt: s.starts_at,
                slotId: s.id,
              },
            })),
          );
          return;
        }

        if (id === "reschedule:slot") {
          await updateReservation(p.id!, {
            starts_at: p.startsAt!,
            status: "pending",
          });
          if (p.slotId) {
            await bookAppointmentSlot({
              slotId: p.slotId,
              reservationId: p.id!,
            });
          }
          const active = draftRef.current.activePatient;
          if (active) {
            remember({
              ...active,
              lastReservationId: p.id!,
            });
          }
          toast.success(t("admin.chat.toast.rescheduled"));
          await push(
            "assistant",
            t("admin.chat.msg.movedTo").replace("{when}", formatWhen(p.startsAt!)),
            await nextActions(),
          );
          return;
        }

        if (id.startsWith("noshow:")) {
          const resId = id.slice("noshow:".length);
          await updateReservation(resId, { status: "no_show" });
          if (p.patientKey && p.name) {
            remember({
              patientKey: p.patientKey,
              name: p.name,
              phone: p.phone ?? "",
              href: p.href,
            });
          }
          toast.success(t("admin.chat.toast.noshow"));
          await push(
            "assistant",
            t("admin.chat.msg.markedNoshowDetail").replace("{name}", p.name ?? t("admin.chat.patient")),
            await nextActions(),
          );
          return;
        }

        if (id === "patient:open") {
          const patient = toActive(p);
          if (patient) remember(patient);
          await push("user", p.name ?? t("admin.chat.patient"));
          await push(
            "assistant",
            t("admin.chat.msg.gotWorking")
              .replace("{name}", p.name ?? "")
              .replace("{phone}", p.phone || t("admin.chat.noPhone")),
            patient
              ? patientScopedActions(patient, t)
              : [
                  {
                    id: "patient:goto",
                    label: t("admin.chat.action.openPatient"),
                    payload: { href: p.href ?? "#" },
                  },
                  ...getStartActions(t),
                ],
          );
          return;
        }

        if (id === "patient:goto") {
          if (p.href) window.location.href = p.href;
          return;
        }

        if (id.startsWith("today:")) {
          if (p.patientKey && p.name) {
            remember({
              patientKey: p.patientKey,
              name: p.name,
              phone: p.phone ?? "",
              href: p.href,
            });
          }
          await push("user", action.label);
          await push("assistant", `${action.label}.`, [
            {
              id: "patient:goto",
              label: t("admin.chat.action.openPatient"),
              payload: { href: p.href ?? "#" },
            },
            {
              id: "pending:confirm",
              label: t("admin.chat.action.confirm"),
              payload: { id: p.id! },
            },
            { id: "noshow", label: t("admin.chat.action.noshow"), payload: p },
            ...(await nextActions()),
          ]);
          return;
        }

        if (id === "noshow") {
          await updateReservation(p.id!, { status: "no_show" });
          toast.success(t("admin.chat.toast.noshow"));
          await push(
            "assistant",
            t("admin.chat.msg.markedNoshowDetail").replace("{name}", p.name ?? t("admin.chat.patient")),
            await nextActions(),
          );
          return;
        }

        if (id === "note:patient") {
          const patient = toActive(p);
          const note: NoteDraft = {
            patientKey: p.patientKey,
            name: p.name,
            phone: p.phone,
          };
          if (patient) remember(patient);
          setDraft((d) => ({
            ...d,
            note,
            activePatient: patient ?? d.activePatient,
          }));
          await push("user", p.name ?? t("admin.chat.patient"));
          await offerNoteStamps(note);
          return;
        }

        if (id === "note:stamp") {
          const note = { ...draftRef.current.note, stamp: p.stamp };
          setDraft((d) => ({ ...d, note }));
          await push("user", p.stamp!);
          await push(
            "assistant",
            t("admin.chat.msg.saveNoteConfirm")
              .replace("{stamp}", p.stamp ?? "")
              .replace("{name}", note.name ?? ""),
            [
              { id: "note:confirm", label: t("admin.chat.action.saveNote") },
              { id: "book:cancel", label: t("admin.poll.cancel") },
            ],
          );
          return;
        }

        if (id === "note:confirm") {
          const note = draftRef.current.note;
          if (!note.patientKey || !note.stamp) {
            await push(
              "assistant",
              t("admin.chat.msg.missingNote"),
              await nextActions(),
            );
            return;
          }
          const existing = await getPatientProfile(note.patientKey);
          const line = `[${new Date().toLocaleString()}] ${note.stamp}${
            note.text ? ` — ${note.text}` : ""
          }`;
          const nextNotes = existing?.notes
            ? `${existing.notes.trim()}\n${line}`
            : line;
          await upsertPatientProfile(note.patientKey, {
            display_name: note.name || existing?.display_name || t("admin.chat.patient"),
            phone: note.phone || existing?.phone || "",
            email: existing?.email ?? null,
            date_of_birth: existing?.date_of_birth ?? null,
            age_years: existing?.age_years ?? null,
            gender: existing?.gender ?? "",
            medical_history: existing?.medical_history ?? [],
            allergies: existing?.allergies ?? [],
            medications: existing?.medications ?? "",
            notes: nextNotes,
          });
          setDraft((d) => ({ ...d, note: {} }));
          const active = draftRef.current.activePatient;
          if (active || note.patientKey) {
            const patient: ActivePatient = {
              patientKey: note.patientKey!,
              name: note.name || active?.name || t("admin.chat.patient"),
              phone: note.phone || active?.phone || "",
              href: active?.href,
              lastReservationId: active?.lastReservationId,
              noteCount: (active?.noteCount ?? 0) + 1,
            };
            remember(patient);
            toast.success(t("admin.chat.toast.noteSaved"));
            await push(
              "assistant",
              t("admin.chat.msg.noteSaved"),
              patientScopedActions(patient, t),
            );
            return;
          }
          toast.success(t("admin.chat.toast.noteSaved"));
          await push("assistant", t("admin.chat.msg.noteSaved"), await nextActions());
          return;
        }

        await push("assistant", t("admin.chat.msg.unknownChip"), await nextActions());
      }),
    [
      nextActions,
      offerNoteStamps,
      offerSlots,
      openBookPanel,
      push,
      remember,
      run,
      startBook,
      startNoshow,
      startNote,
      startPatient,
      startPending,
      startToday,
      t,
    ],
  );

  async function continueBookFromPanel() {
    const panel = bookPanelRef.current;
    if (!panel) {
      toast.error(t("admin.chat.toast.formClosed"));
      return;
    }
    const name = panel.name.trim();
    const phone = panel.phone.trim();
    const picked = panel.options.find((o) => o.id === panel.selectedId);
    if (!name || !phone || !picked) {
      toast.error(t("admin.chat.toast.requiredFields"));
      return;
    }
    try {
      const patientKey =
        draftRef.current.book.patientKey ?? phoneToPatientKey(phone);
      const patient: ActivePatient = {
        patientKey,
        name,
        phone,
        href: `/admin/patients/${encodeURIComponent(patientKey)}`,
      };
      remember(patient);
      const book: BookDraft = {
        patientKey,
        name,
        phone,
        serviceId: picked.serviceId || null,
        serviceLabel: picked.serviceLabel,
      };
      setDraft((d) => ({ ...d, book, activePatient: patient }));
      setBookPanel(null);
      await push("user", `${name} · ${phone} · ${picked.serviceLabel}`);
      await offerSlots(book);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.chat.toast.couldNotContinue"));
      await push(
        "assistant",
        err instanceof Error ? err.message : t("admin.chat.continueDatesFailed"),
        await nextActions(),
      );
    }
  }

  async function consumeNewPatientLine(text: string): Promise<boolean> {
    if (!text.includes("|")) return false;
    const [nameRaw, phoneRaw] = text.split("|");
    const name = nameRaw?.trim();
    const phone = phoneRaw?.trim();
    if (!name || !phone) return false;
    await openBookPanel({
      name,
      phone,
      patientKey: phoneToPatientKey(phone),
    });
    return true;
  }

  async function consumeNoteLine(text: string): Promise<boolean> {
    const noteBase = draftRef.current.note;
    const active = draftRef.current.activePatient;
    if (!noteBase.patientKey && !active) return false;
    // Only treat free text as a note when we're mid-note or user said "note:"
    if (!noteBase.patientKey && !/^note\s*:/i.test(text)) return false;
    const stampText = text.replace(/^note\s*:/i, "").trim();
    if (!stampText) return false;
    const note: NoteDraft = {
      patientKey: noteBase.patientKey ?? active?.patientKey,
      name: noteBase.name ?? active?.name,
      phone: noteBase.phone ?? active?.phone,
      stamp: stampText,
    };
    setDraft((d) => ({ ...d, note }));
    await push(
      "assistant",
      t("admin.chat.msg.saveNoteConfirm")
        .replace("{stamp}", note.stamp ?? "")
        .replace("{name}", note.name ?? ""),
      [
        { id: "note:confirm", label: t("admin.chat.action.saveNote") },
        { id: "book:cancel", label: t("admin.poll.cancel") },
      ],
    );
    return true;
  }

  return {
    busy,
    activePatient: draft.activePatient ?? null,
    bookPanel,
    setBookName: (name: string) =>
      setBookPanel((prev) => (prev ? { ...prev, name } : prev)),
    setBookPhone: (phone: string) =>
      setBookPanel((prev) => (prev ? { ...prev, phone } : prev)),
    selectBookService: (option: BookPollOption) =>
      setBookPanel((prev) =>
        prev ? { ...prev, selectedId: option.id } : prev,
      ),
    continueBookFromPanel: () => void continueBookFromPanel(),
    cancelBookPanel: () => {
      setBookPanel(null);
      void (async () => {
        await push(
          "assistant",
          t("admin.chat.msg.cancelled"),
          await nextActions(),
        );
      })();
    },
    handleAction,
    startBook,
    startToday,
    startPending,
    startNoshow,
    startPatient,
    startNote,
    consumeNewPatientLine,
    consumeNoteLine,
    clearActivePatient: () => {
      setBookPanel(null);
      setDraft(emptyDraft());
      onActivePatientChange?.(null);
    },
  };
}
