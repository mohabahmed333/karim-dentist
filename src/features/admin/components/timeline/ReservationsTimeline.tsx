"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, LayoutGrid, Plus } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import type { Reservation } from "@/services/reservations/types";
import { rescheduleReservation } from "@/services/reservations/mutations";
import {
  bookOpenSlotMatchingStartsAt,
  releaseAppointmentSlot,
} from "@/services/clinic_schedule";
import {
  decodePatientKey,
  filterPatientGroups,
  groupReservationsByPatient,
  patientProfilePath,
  type PatientTimelineFilter,
} from "@/services/reservations/patientHistory";
import {
  buildCalendarGrid,
  filterReservationsForTimeline,
  formatCalendarMonthLabel,
  groupReservationsByDay,
  reservationDayIso,
  shiftMonth,
  type TimelineStatusFilter,
} from "@/services/reservations/timeline";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/lib/i18n";
import {
  calendarMonthGridVariants,
  calendarMonthMotionKey,
  calendarMonthSlideDir,
  calendarMonthTitleTransition,
  calendarMonthTitleVariants,
  calendarMonthTransition,
} from "@/features/admin/lib/calendarMonthMotion";
import { CalendarMonthGrid } from "./CalendarMonthGrid";
import { CalendarReservationPanel } from "./CalendarReservationPanel";
import { ReservationsTimelineFilters } from "./ReservationsTimelineFilters";
import { ReservationsTimelinePatientFilters } from "./ReservationsTimelinePatientFilters";
import {
  ReservationsTimelineViewToggle,
  type TimelineViewMode,
} from "./ReservationsTimelineViewToggle";

type Props = {
  reservations: Reservation[];
  title?: string;
};

export function ReservationsTimeline({
  reservations,
  title = "Appointments",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { dir: localeDir } = useLocale();
  const reduced = useReducedMotion();
  const rtl = localeDir === "rtl";
  const [month, setMonth] = useState(() => new Date());
  const [monthDir, setMonthDir] = useState(0);
  const [statusFilter, setStatusFilter] = useState<TimelineStatusFilter>("all");
  const [viewMode, setViewMode] = useState<TimelineViewMode>("patient");
  const [patientFilter, setPatientFilter] =
    useState<PatientTimelineFilter>("all");
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedDayIso, setSelectedDayIso] = useState<string | null>(null);
  const [selectedReservationId, setSelectedReservationId] = useState<
    string | null
  >(null);
  const [items, setItems] = useState(reservations);
  const [movingReservationId, setMovingReservationId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    setItems(reservations);
  }, [reservations]);

  const calendarDays = useMemo(() => buildCalendarGrid(month), [month]);
  const monthKey = calendarMonthMotionKey(month);
  const monthLabel = formatCalendarMonthLabel(month);
  const gridVariants = useMemo(() => calendarMonthGridVariants(rtl), [rtl]);
  const gridTransition = calendarMonthTransition(reduced);
  const titleTransition = calendarMonthTitleTransition(reduced);
  const titleVariants = calendarMonthTitleVariants();

  function goToMonth(next: Date) {
    setMonthDir(calendarMonthSlideDir(month, next));
    setMonth(next);
  }

  function shiftCalendarMonth(delta: -1 | 1) {
    setMonthDir(delta);
    setMonth((value) => shiftMonth(value, delta));
  }

  const filtered = useMemo(
    () => filterReservationsForTimeline(items, statusFilter),
    [items, statusFilter],
  );
  const patientGroups = useMemo(
    () => groupReservationsByPatient(filtered),
    [filtered],
  );
  const filteredReservations = useMemo(() => {
    const groups = filterPatientGroups(
      patientGroups,
      patientFilter,
      patientSearch,
    );
    const allowed = new Set(
      groups.flatMap((group) => group.visits.map((visit) => visit.id)),
    );
    if (patientFilter === "all" && !patientSearch.trim()) return filtered;
    return filtered.filter((row) => allowed.has(row.id));
  }, [filtered, patientFilter, patientSearch, patientGroups]);
  const eventsByDay = useMemo(
    () => groupReservationsByDay(filteredReservations),
    [filteredReservations],
  );
  const selectedReservation = useMemo(
    () =>
      selectedReservationId
        ? (filteredReservations.find((row) => row.id === selectedReservationId) ??
          null)
        : null,
    [filteredReservations, selectedReservationId],
  );
  const dayEvents = selectedDayIso
    ? (eventsByDay.get(selectedDayIso) ?? [])
    : [];

  const basePath = pathname.startsWith("/admin/reservations")
    ? "/admin/reservations"
    : "/admin";
  const showSidePanel = selectedDayIso !== null;

  useEffect(() => {
    const encoded = searchParams.get("patient");
    if (!encoded) return;
    router.replace(patientProfilePath(decodePatientKey(encoded)));
  }, [searchParams, router]);

  useEffect(() => {
    const selected = searchParams.get("selected");
    if (!selected) return;
    const row = filteredReservations.find((item) => item.id === selected);
    if (!row) return;
    const iso = reservationDayIso(row.starts_at);
    setSelectedReservationId(row.id);
    setSelectedDayIso(iso);
    const next = new Date(`${iso}T12:00:00`);
    setMonthDir(calendarMonthSlideDir(month, next));
    setMonth(next);
    // Sync selection from URL; month is read for slide direction only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, filteredReservations]);

  function selectDay(iso: string) {
    setSelectedDayIso(iso);
    setSelectedReservationId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("selected");
    params.delete("patient");
    params.set("date", iso);
    router.replace(`${basePath}?${params.toString()}`);
  }

  function selectReservation(id: string) {
    const row = filteredReservations.find((item) => item.id === id);
    if (!row) return;
    const iso = reservationDayIso(row.starts_at);
    setSelectedDayIso(iso);
    setSelectedReservationId(id);
    const params = new URLSearchParams(searchParams.toString());
    params.set("selected", id);
    params.set("date", iso);
    router.replace(`${basePath}?${params.toString()}`);
  }

  function closeDayPanel() {
    setSelectedDayIso(null);
    setSelectedReservationId(null);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("selected");
    params.delete("date");
    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath);
  }

  async function moveReservationToDay(
    reservationId: string,
    targetDate: string,
  ) {
    const reservation =
      items.find((row) => row.id === reservationId) ??
      filteredReservations.find((row) => row.id === reservationId);
    if (!reservation) return;

    const currentDate = reservationDayIso(reservation.starts_at);
    if (currentDate === targetDate) {
      selectReservation(reservationId);
      return;
    }

    setMovingReservationId(reservationId);
    try {
      await releaseAppointmentSlot(reservationId);
      const updated = await rescheduleReservation(reservation, targetDate);
      await bookOpenSlotMatchingStartsAt({
        startsAtIso: updated.starts_at,
        reservationId: updated.id,
      });
      setItems((prev) =>
        prev.map((row) => (row.id === updated.id ? updated : row)),
      );
      setSelectedDayIso(targetDate);
      setSelectedReservationId(updated.id);
      goToMonth(new Date(`${targetDate}T12:00:00`));
      const params = new URLSearchParams(searchParams.toString());
      params.set("selected", updated.id);
      params.set("date", targetDate);
      router.replace(`${basePath}?${params.toString()}`);
      toast.success("Appointment moved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Move failed");
    } finally {
      setMovingReservationId(null);
    }
  }

  function eventLabel(reservation: Reservation): string {
    return viewMode === "patient"
      ? reservation.patient_name
      : reservation.service_label;
  }

  return (
    <section className="rounded-[28px] bg-white shadow-[0_20px_60px_rgba(15,39,68,0.06)] ring-1 ring-[#e6e8ec] lg:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e6e8ec] px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-[#e6e8ec] p-2 text-[#6b7280] hover:bg-white"
            onClick={() => shiftCalendarMonth(-1)}
            aria-label="Previous month"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
          <div className="relative flex min-h-[1.75rem] min-w-[10rem] items-center justify-center overflow-hidden">
            <AnimatePresence initial={false} mode="wait">
              <motion.h2
                key={monthKey}
                variants={titleVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={titleTransition}
                className="text-center text-lg font-semibold text-[#0f2744]"
              >
                {monthLabel}
              </motion.h2>
            </AnimatePresence>
          </div>
          <button
            type="button"
            className="rounded-lg border border-[#e6e8ec] p-2 text-[#6b7280] hover:bg-white"
            onClick={() => shiftCalendarMonth(1)}
            aria-label="Next month"
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`${basePath}?new=1`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#7c5cff] px-4 py-2 text-sm font-medium text-white hover:bg-[#6b4fe6]"
          >
            <Plus className="size-4" />
            New appointment
          </Link>
          <Link
            href="/admin/patients"
            className="rounded-lg border border-[#e6e8ec] p-2 text-[#6b7280] hover:bg-white"
            aria-label="All patients"
          >
            <LayoutGrid className="size-4" />
          </Link>
          <ReservationsTimelineViewToggle
            value={viewMode}
            onChange={setViewMode}
          />
          <ReservationsTimelinePatientFilters
            search={patientSearch}
            onSearchChange={setPatientSearch}
            filter={patientFilter}
            onFilterChange={setPatientFilter}
          />
          <ReservationsTimelineFilters
            value={statusFilter}
            onChange={setStatusFilter}
            activeCount={filteredReservations.length}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 lg:flex-row">
        <div className="relative min-w-0 flex-1 overflow-hidden">
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
                selectedReservationId={selectedReservationId}
                movingReservationId={movingReservationId}
                eventLabel={eventLabel}
                onSelectDay={selectDay}
                onSelectReservation={selectReservation}
                onMoveReservation={moveReservationToDay}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        {showSidePanel ? (
          <CalendarReservationPanel
            dayIso={selectedDayIso}
            reservation={selectedReservation}
            dayEvents={dayEvents}
            reservationsBase={basePath}
            isRescheduling={movingReservationId !== null}
            onClose={closeDayPanel}
            onSelectReservation={selectReservation}
            onReschedule={(targetDate) => {
              if (!selectedReservation) return;
              void moveReservationToDay(selectedReservation.id, targetDate);
            }}
          />
        ) : null}
      </div>
    </section>
  );
}
