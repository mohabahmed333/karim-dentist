"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { useReservationFormShowreel } from "@/features/admin/hooks/useReservationFormShowreel";
import {
  calendarMonthGridVariants,
  calendarMonthMotionKey,
  calendarMonthSlideDir,
  calendarMonthTitleTransition,
  calendarMonthTitleVariants,
  calendarMonthTransition,
} from "@/features/admin/lib/calendarMonthMotion";
import {
  bookOpenSlotMatchingStartsAt,
  listOpenAppointmentSlots,
  releaseAppointmentSlot,
} from "@/services/clinic_schedule";
import {
  rescheduleReservation,
  softDeleteReservation,
} from "@/services/reservations/mutations";
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
import {
  calendarDayBookingBlockReason,
  localTodayIso,
  openSlotDaySet,
} from "@/features/admin/lib/calendarDayBooking";
import { useLocale, useTranslations } from "@/lib/i18n";
import { ReservationServiceLabel } from "@/features/admin/components/ReservationServiceLabel";
import { useReservationFilterQuery } from "@/features/admin/lib/useReservationFilterQuery";
import { useReservationTableServerFiltering } from "@/features/admin/lib/useReservationTableServerFiltering";

type Props = {
  /** Month calendar + today rail (no search / pagination). */
  reservations: Reservation[];
  /** Current table page from Supabase. */
  tableRows: Reservation[];
  tableTotal: number;
  services: Service[];
};

export function ReservationsPageView({
  reservations,
  tableRows,
  tableTotal,
  services,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const reduced = useReducedMotion();
  const rtl = locale === "ar";
  const router = useRouter();
  const editor = useReservationEditor(reservations);
  const searchParams = useSearchParams();
  const [month, setMonth] = useState(() => new Date());
  const [monthDir, setMonthDir] = useState(1);
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [filtering, setFiltering] = useState(false);
  const [openSlotDays, setOpenSlotDays] = useState<Set<string>>(
    () => new Set(),
  );
  const [showreel, setShowreel] = useState(false);
  const filterQuery = useReservationFilterQuery(setFiltering);
  const serverFiltering = useReservationTableServerFiltering(
    tableTotal,
    filterQuery,
  );

  useEffect(() => {
    setShowreel(document.documentElement.dataset.showreelDemo === "1");
  }, []);
  useReservationFormShowreel({ enabled: showreel, setForm: editor.setForm });

  const dateParam = searchParams.get("date");
  const monthRef = useRef(month);
  monthRef.current = month;

  // Only follow the `date` query — other filter params must not reset the viewed month
  // (that caused: next month paints → URL churn → snap/remount → paint again).
  useEffect(() => {
    if (!dateParam) return;
    setSelectedDayIso(dateParam);
    const next = new Date(`${dateParam}T12:00:00`);
    const prev = monthRef.current;
    if (
      prev.getFullYear() === next.getFullYear() &&
      prev.getMonth() === next.getMonth()
    ) {
      return;
    }
    setMonthDir(calendarMonthSlideDir(prev, next));
    setMonth(next);
  }, [dateParam]);

  const calendarDays = useMemo(() => buildCalendarGrid(month), [month]);
  const monthKey = calendarMonthMotionKey(month);
  const gridVariants = useMemo(() => calendarMonthGridVariants(rtl), [rtl]);
  const gridTransition = calendarMonthTransition(reduced);
  const titleTransition = calendarMonthTitleTransition(reduced);
  const titleVariants = calendarMonthTitleVariants();
  const eventsByDay = useMemo(
    () => groupReservationsByDay(editor.items),
    [editor.items],
  );

  function shiftCalendarMonth(delta: -1 | 1) {
    setMonthDir(delta);
    setMonth((m) => shiftMonth(m, delta));
  }

  useEffect(() => {
    if (calendarDays.length === 0) return;
    // The showreel's calendar-click demo can't depend on real open slots
    // existing in whatever environment it's recorded in — mark today
    // (and a few days out) bookable so the click always opens the dialog.
    if (document.documentElement.dataset.showreelDemo === "1") {
      const today = new Date();
      const days = new Set<string>();
      for (let offset = 0; offset <= 6; offset += 1) {
        const d = new Date(today);
        d.setDate(d.getDate() + offset);
        days.add(localTodayIso(d));
      }
      setOpenSlotDays(days);
      return;
    }
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
      const next = new Date(`${targetDate}T12:00:00`);
      setMonthDir(calendarMonthSlideDir(month, next));
      setMonth(next);
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
            onClick={() => shiftCalendarMonth(-1)}
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
          <div className="relative flex min-h-[1.75rem] min-w-[10rem] items-center justify-center overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <motion.h1
                key={monthKey}
                variants={titleVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={titleTransition}
                className="text-center text-lg font-semibold text-[var(--admin-text)]"
              >
                {month.toLocaleDateString(locale === "ar" ? "ar" : "en", {
                  month: "long",
                  year: "numeric",
                })}
              </motion.h1>
            </AnimatePresence>
          </div>
          <button
            type="button"
            aria-label={t("admin.reservations.nextMonth")}
            className="rounded-lg border border-[var(--admin-border)] p-2 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]"
            onClick={() => shiftCalendarMonth(1)}
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <AdminReservationFilters
            services={services}
            onPendingChange={setFiltering}
          />
        </div>
      </header>

      {filtering ? (
        <ReservationsPageSkeleton includeHeader={false} />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.7fr)] lg:items-stretch">
            <div className="relative min-w-0 overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
              <AnimatePresence initial={false} custom={monthDir} mode="wait">
                <motion.div
                  key={monthKey}
                  custom={monthDir}
                  variants={gridVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={gridTransition}
                >
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
                </motion.div>
              </AnimatePresence>
            </div>
            {/* h-0 + min-h-full: row height follows the calendar; rail scrolls inside */}
            <div className="min-h-[20rem] lg:h-0 lg:min-h-full">
              <ReservationsTodayRail
                reservations={editor.items}
                onSelect={editor.openRow}
                services={services}
              />
            </div>
          </div>

          <section className="space-y-2">
            <div className="flex items-center justify-between gap-2 px-0.5">
              <h2 className="text-[14px] font-semibold text-[var(--admin-text)]">
                {t("admin.reservations.all")}
              </h2>
              <p className="text-[12px] text-[var(--admin-muted)]">
                {t("admin.reservations.total").replace(
                  "{count}",
                  String(tableTotal),
                )}
              </p>
            </div>
            <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
              <CollectionTable
                tableId="reservations"
                framed={false}
                rows={tableRows}
                serverFiltering={serverFiltering}
                onRowClick={editor.openRow}
                emptyMessage={t("admin.reservations.empty")}
                searchPlaceholder={t("admin.reservations.patient")}
                bulkEntityLabel={t("admin.reservations.title").toLowerCase()}
                rowActions={[
                  {
                    id: "edit",
                    label: t("admin.edit"),
                    icon: "edit",
                    onClick: (r) => editor.openRow(r.id),
                  },
                  {
                    id: "delete",
                    label: t("admin.delete"),
                    icon: "delete",
                    tone: "danger",
                    onClick: (r) => {
                      editor.openRow(r.id);
                      editor.setDeleteOpen(true);
                    },
                  },
                ]}
                bulkActions={[
                  {
                    id: "delete",
                    label: t("admin.table.bulkDelete"),
                    tone: "danger",
                    onClick: async (selected) => {
                      try {
                        for (const row of selected) {
                          await releaseAppointmentSlot(row.id);
                          await softDeleteReservation(row.id);
                        }
                        toast.success(t("admin.delete"));
                        router.refresh();
                      } catch (error) {
                        toast.error(
                          error instanceof Error
                            ? error.message
                            : t("admin.table.bulkDelete"),
                        );
                      }
                    },
                  },
                ]}
                columns={[
                  {
                    key: "patient",
                    header: t("admin.reservations.patient"),
                    sortValue: (r) => r.patient_name,
                    searchValue: (r) =>
                      `${r.patient_name} ${r.phone ?? ""} ${r.service_label}`,
                    cell: (r) => (
                      <span className="font-medium">{r.patient_name}</span>
                    ),
                  },
                  {
                    key: "phone",
                    header: t("admin.reservations.phone"),
                    sortValue: (r) => r.phone ?? "",
                    cell: (r) => r.phone || "—",
                  },
                  {
                    key: "service",
                    header: t("admin.reservations.service"),
                    sortValue: (r) => r.service_label,
                    cell: (r) => (
                      <ReservationServiceLabel
                        serviceId={r.service_id}
                        storedLabel={r.service_label}
                        services={services}
                      />
                    ),
                  },
                  {
                    key: "when",
                    header: t("admin.reservations.when"),
                    sortValue: (r) => r.starts_at,
                    cell: (r) => formatReservationWhen(r.starts_at),
                  },
                  {
                    key: "status",
                    header: t("admin.status"),
                    sortValue: (r) => r.status,
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
