"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import type { Reservation } from "@/services/reservations/types";
import type { Service } from "@/services/services/types";
import {
  addCalendarDays,
  dayScheduleDayIso,
  daySchedulePrefetchDays,
  dayScheduleQueryBounds,
  dayScheduleTitle,
  dayWithinCoverage,
  isSameCalendarDay,
  packDayBlocks,
  reservationsForDay,
} from "@/features/admin/lib/dayScheduleModel";
import {
  dayScheduleMotionKey,
  dayScheduleTransition,
  dayScheduleVariants,
} from "@/features/admin/lib/dayScheduleMotion";
import { useTranslations } from "@/lib/i18n";
import { DayScheduleGrid } from "./DayScheduleGrid";

type Props = {
  reservations: Reservation[];
  /** Inclusive YYYY-MM-DD window already loaded with `reservations`. */
  coverageFrom: string;
  coverageTo: string;
  services?: Service[];
  onPatientSelect?: (reservation: Reservation) => void;
};

async function fetchReservationsForDay(day: Date): Promise<Reservation[]> {
  const { startIso, endIso } = dayScheduleQueryBounds(day);
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .is("deleted_at", null)
    .neq("status", "cancelled")
    .gte("starts_at", startIso)
    .lte("starts_at", endIso)
    .order("starts_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export function DashboardDaySchedule({
  reservations,
  coverageFrom,
  coverageTo,
  services = [],
  onPatientSelect,
}: Props) {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const [day, setDay] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dir, setDir] = useState(1);
  const propRows = useMemo(
    () => reservationsForDay(reservations, day),
    [reservations, day],
  );
  const [fetchedByDay, setFetchedByDay] = useState<
    Record<string, Reservation[]>
  >({});
  const fetchedByDayRef = useRef(fetchedByDay);
  fetchedByDayRef.current = fetchedByDay;
  const [loadingDay, setLoadingDay] = useState(false);
  const variants = useMemo(() => dayScheduleVariants(), []);
  const transition = dayScheduleTransition(reduced);
  const dayIso = dayScheduleDayIso(day);
  const covered = dayWithinCoverage(day, coverageFrom, coverageTo);

  function shiftDay(delta: number) {
    setDir(delta > 0 ? 1 : -1);
    setDay((d) => addCalendarDays(d, delta));
  }

  // Prefetch tomorrow + day after when outside SSR coverage (retry-safe under Strict Mode).
  useEffect(() => {
    const targets = daySchedulePrefetchDays().filter(
      (d) => !dayWithinCoverage(d, coverageFrom, coverageTo),
    );
    if (targets.length === 0) return;

    let cancelled = false;
    void (async () => {
      const entries = await Promise.all(
        targets.map(async (d) => {
          const iso = dayScheduleDayIso(d);
          if (fetchedByDayRef.current[iso]) {
            return [iso, fetchedByDayRef.current[iso]!] as const;
          }
          try {
            const rows = await fetchReservationsForDay(d);
            return [iso, rows] as const;
          } catch {
            return null;
          }
        }),
      );
      if (cancelled) return;
      setFetchedByDay((prev) => {
        const next = { ...prev };
        for (const entry of entries) {
          if (!entry) continue;
          next[entry[0]] = entry[1];
        }
        return next;
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [coverageFrom, coverageTo]);

  // Fetch the selected day when outside SSR coverage and not already cached.
  useEffect(() => {
    if (covered) {
      setLoadingDay(false);
      return;
    }
    if (fetchedByDayRef.current[dayIso]) {
      setLoadingDay(false);
      return;
    }

    let cancelled = false;
    async function load() {
      setLoadingDay(true);
      try {
        const rows = await fetchReservationsForDay(day);
        if (cancelled) return;
        setFetchedByDay((prev) =>
          prev[dayIso] ? prev : { ...prev, [dayIso]: rows },
        );
      } catch {
        /* keep prior cache / empty */
      } finally {
        if (!cancelled) setLoadingDay(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [day, dayIso, covered, coverageFrom, coverageTo]);

  const rows = covered ? propRows : (fetchedByDay[dayIso] ?? propRows);
  const { blocks, laneCount } = useMemo(() => packDayBlocks(rows), [rows]);

  const today = new Date();
  let dayLabel: string;
  if (isSameCalendarDay(day, today)) {
    dayLabel = t("admin.overview.today");
  } else if (isSameCalendarDay(day, addCalendarDays(today, 1))) {
    dayLabel = t("admin.overview.tomorrow");
  } else if (isSameCalendarDay(day, addCalendarDays(today, 2))) {
    dayLabel = t("admin.overview.afterTomorrow");
  } else {
    dayLabel = dayScheduleTitle(day);
  }

  const bookingsLabel =
    rows.length === 1
      ? t("admin.overview.bookingCountOne").replace("{count}", String(rows.length))
      : t("admin.overview.bookingsCount").replace("{count}", String(rows.length));

  const legend = [
    {
      id: "confirmed",
      label: t("admin.reservations.confirmed"),
      tone: "var(--admin-primary)",
    },
    {
      id: "pending",
      label: t("admin.reservations.pending"),
      tone: "var(--admin-secondary)",
    },
    {
      id: "completed",
      label: t("admin.reservations.completed"),
      tone: "var(--admin-muted)",
    },
  ] as const;

  return (
    <section className="admin-card flex h-full min-h-0 flex-col overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-panel)]">
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--admin-text)]">
            {t("admin.overview.daySchedule")}
          </h2>
          <p className="text-[12px] text-[var(--admin-muted)]">
            {dayLabel} · {t("admin.overview.appointmentsChart")}
            {loadingDay ? " · …" : null}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={t("admin.overview.prevDay")}
            onClick={() => shiftDay(-1)}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <ChevronLeft className="size-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            aria-label={t("admin.overview.nextDay")}
            onClick={() => shiftDay(1)}
            className="rounded-md p-1.5 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"
          >
            <ChevronRight className="size-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2.5 text-[11px] text-[var(--admin-muted)]">
        {legend.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-1.5">
            <span
              className="size-2 rounded-full"
              style={{ background: item.tone }}
            />
            {item.label}
          </span>
        ))}
        <span className="ms-auto">{bookingsLabel}</span>
      </div>

      <div className="relative min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={dayScheduleMotionKey(day)}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
            className="min-h-full"
          >
            <DayScheduleGrid
              blocks={blocks}
              laneCount={laneCount}
              empty={rows.length === 0 && !loadingDay}
              emptyLabel={t("admin.overview.noAppointmentsDay")}
              services={services}
              onPatientSelect={onPatientSelect}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
