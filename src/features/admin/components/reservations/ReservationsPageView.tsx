"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { toast } from "sonner";
import { AdminReservationFilters } from "@/features/admin/components/AdminReservationFilters";
import { CollectionTable } from "@/features/admin/components/CollectionTable";
import { ConfirmDeleteDialog } from "@/features/admin/components/ConfirmDeleteDialog";
import { ReservationFormDialog } from "@/features/admin/components/reservations/ReservationFormDialog";
import { ReservationFormDrawer } from "@/features/admin/components/reservations/ReservationFormDrawer";
import { ReservationsPageSkeleton } from "@/features/admin/components/reservations/ReservationsPageSkeleton";
import { ReservationsTodayRail } from "@/features/admin/components/reservations/ReservationsTodayRail";
import { CalendarMonthGrid } from "@/features/admin/components/timeline/CalendarMonthGrid";
import { useReservationEditor } from "@/features/admin/hooks/useReservationEditor";
import { Button } from "@/components/ui/button";
import {
  bookOpenSlotMatchingStartsAt,
  releaseAppointmentSlot,
} from "@/services/clinic_schedule";
import { rescheduleReservation } from "@/services/reservations/mutations";
import {
  formatReservationWhen,
  statusBadgeClass,
} from "@/services/reservations/stats";
import {
  buildCalendarGrid,
  groupReservationsByDay,
  reservationDayIso,
  shiftMonth,
} from "@/services/reservations/timeline";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import { listOpenAppointmentSlots } from "@/services/clinic_schedule";
import {
  calendarDayBookingBlockReason,
  localTodayIso,
  openSlotDaySet,
} from "@/features/admin/lib/calendarDayBooking";
import { useLocale, useTranslations } from "@/lib/i18n";

type Props = {
  reservations: Reservation[];
  services: Service[];
};

export function ReservationsPageView({ reservations, services }: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const editor = useReservationEditor(reservations);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(() => new Date());
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [filtering, setFiltering] = useState(false);
  const [openSlotDays, setOpenSlotDays] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const date = searchParams.get("date");
    if (date) {
      setSelectedDayIso(date);
      setMonth(new Date(`${date}T12:00:00`));
    }
  }, [searchParams]);

  const calendarDays = useMemo(() => buildCalendarGrid(month), [month]);
  const eventsByDay = useMemo(
    () => groupReservationsByDay(editor.items),
    [editor.items],
  );

  useEffect(() => {
    if (calendarDays.length === 0) return;
    const from = calendarDays[0]!.iso;
    const to = calendarDays[calendarDays.length - 1]!.iso;
    let cancelled = false;
    void listOpenAppointmentSlots({
      fromIso: new Date(`${from}T00:00:00`).toISOString(),
      toIso: new Date(`${to}T23:59:59`).toISOString(),
    })
      .then((slots) => {
        if (!cancelled) setOpenSlotDays(openSlotDaySet(slots));
      })
      .catch(() => {
        if (!cancelled) setOpenSlotDays(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [calendarDays]);

  function onCalendarDayClick(iso: string) {
    setSelectedDayIso(iso);
    const block = calendarDayBookingBlockReason(
      iso,
      localTodayIso(),
      openSlotDays,
    );
    if (block === "past") {
      toast.message(t("admin.reservations.dayBeforeToday"));
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", iso);
      params.delete("selected");
      params.delete("new");
      router.replace(`/admin/reservations?${params.toString()}`);
      return;
    }
    if (block === "no_slots") {
      toast.message(t("admin.reservations.dayNoSlots"));
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", iso);
      params.delete("selected");
      params.delete("new");
      router.replace(`/admin/reservations?${params.toString()}`);
      return;
    }
    editor.openNew(iso);
  }

  const createOpen = editor.selectedId === "new";
  const editId =
    editor.selectedId && editor.selectedId !== "new"
      ? editor.selectedId
      : null;
  const drawerOpen = editId !== null;

  function onCreateOpenChange(open: boolean) {
    if (!open) editor.closeDialog();
  }

  async function moveReservationToDay(
    reservationId: string,
    targetDate: string,
  ) {
    const reservation = editor.items.find((row) => row.id === reservationId);
    if (!reservation) return;
    const currentDate = reservationDayIso(reservation.starts_at);
    if (currentDate === targetDate) {
      editor.openRow(reservationId);
      return;
    }
    setMovingId(reservationId);
    try {
      await releaseAppointmentSlot(reservationId);
      const updated = await rescheduleReservation(reservation, targetDate);
      await bookOpenSlotMatchingStartsAt({
        startsAtIso: updated.starts_at,
        reservationId: updated.id,
      });
      editor.upsertItem(updated);
      setSelectedDayIso(targetDate);
      setMonth(new Date(`${targetDate}T12:00:00`));
      toast.success(t("admin.reservations.moved"));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("admin.reservations.moveFailed"));
    } finally {
      setMovingId(null);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={t("admin.reservations.prevMonth")}
            className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
            onClick={() => setMonth((m) => shiftMonth(m, -1))}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
          <h1 className="min-w-[10rem] text-center text-lg font-semibold text-[var(--admin-text)]">
            {month.toLocaleDateString(locale === "ar" ? "ar" : "en", {
              month: "long",
              year: "numeric",
            })}
          </h1>
          <button
            type="button"
            aria-label={t("admin.reservations.nextMonth")}
            className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
            onClick={() => setMonth((m) => shiftMonth(m, 1))}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            disabled={editor.pending}
            onClick={() => editor.openNew(selectedDayIso ?? undefined)}
            className="bg-[var(--admin-primary)] text-white hover:opacity-90"
          >
            <Plus className="size-4" />
            {t("admin.reservations.new")}
          </Button>
        </div>
      </header>

      <AdminReservationFilters
        services={services}
        onPendingChange={setFiltering}
      />

      {filtering ? (
        <ReservationsPageSkeleton />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.7fr)]">
            <div className="min-w-0 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
              <CalendarMonthGrid
                days={calendarDays}
                eventsByDay={eventsByDay}
                selectedDayIso={selectedDayIso}
                selectedReservationId={
                  editor.selectedId && editor.selectedId !== "new"
                    ? editor.selectedId
                    : null
                }
                movingReservationId={movingId}
                eventLabel={(r) => r.patient_name}
                onSelectDay={onCalendarDayClick}
                onSelectReservation={editor.openRow}
                onMoveReservation={(id, date) => {
                  void moveReservationToDay(id, date);
                }}
              />
            </div>
            <ReservationsTodayRail
              reservations={editor.items}
              onSelect={editor.openRow}
            />
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
                {t("admin.reservations.all")}
              </h2>
              <p className="text-[12px] text-[var(--admin-muted)]">
                {t("admin.reservations.total").replace("{count}", String(editor.items.length))}
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
              <CollectionTable
                rows={[...editor.items].sort((a, b) =>
                  b.starts_at.localeCompare(a.starts_at),
                )}
                onRowClick={editor.openRow}
                emptyMessage={t("admin.reservations.empty")}
                columns={[
                  {
                    key: "patient",
                    header: t("admin.reservations.patient"),
                    cell: (r) => (
                      <span className="font-medium">{r.patient_name}</span>
                    ),
                  },
                  {
                    key: "phone",
                    header: t("admin.reservations.phone"),
                    cell: (r) => r.phone || "—",
                  },
                  {
                    key: "service",
                    header: t("admin.reservations.service"),
                    cell: (r) => r.service_label,
                  },
                  {
                    key: "when",
                    header: t("admin.reservations.when"),
                    cell: (r) => formatReservationWhen(r.starts_at),
                  },
                  {
                    key: "status",
                    header: t("admin.status"),
                    cell: (r) => (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs capitalize ${statusBadgeClass(r.status)}`}
                      >
                        {r.status}
                      </span>
                    ),
                  },
                ]}
              />
            </div>
          </section>
        </>
      )}

      <ReservationFormDialog
        open={createOpen}
        values={editor.form}
        services={services}
        reservations={editor.items}
        pending={editor.pending}
        onOpenChange={onCreateOpenChange}
        onChange={editor.setForm}
        onSave={() => void editor.saveReservation()}
      />

      <ReservationFormDrawer
        open={drawerOpen}
        values={editor.form}
        reservation={
          editId
            ? (editor.items.find((row) => row.id === editId) ?? null)
            : null
        }
        services={services}
        reservations={editor.items}
        selectedId={editId ?? ""}
        pending={editor.pending}
        onClose={editor.closeDialog}
        onChange={editor.setForm}
        onSave={() => editor.saveReservation()}
        onDeleteClick={() => editor.setDeleteOpen(true)}
        onStatus={(status) => void editor.setStatus(status)}
      />

      <ConfirmDeleteDialog
        open={editor.deleteOpen}
        onOpenChange={editor.setDeleteOpen}
        title={t("admin.reservations.deleteTitle")}
        description={t("admin.reservations.deleteDesc")}
        pending={editor.pending}
        onConfirm={() => void editor.confirmDelete()}
      />
    </div>
  );
}
