"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import { BillPatientDialog } from "@/features/admin/components/billing/BillPatientDialog";
import { PatientEhrView } from "@/features/admin/components/patients/ehr-view/PatientEhrView";
import { pickCurrentReservation } from "@/features/admin/lib/dayScheduleModel";
import {
  getPatientGroup,
  patientKeyFromReservation,
  type PatientGroup,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import {
  loadMyDayPatientBundle,
  type MyDayPatientBundle,
} from "@/services/my_day/actions";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MyDayPatientChat } from "./MyDayPatientChat";
import { MyDayPatientHeader } from "./MyDayPatientHeader";
import { MyDayScheduleList } from "./MyDayScheduleList";
import { MyDayStats } from "./MyDayStats";

type Props = {
  todaysReservations: Reservation[];
  directory: PatientGroup[];
  initialReservationId: string | null;
  initialBundle: MyDayPatientBundle | null;
  currentDoctorId: string | null;
  canPickDoctor: boolean;
  canPropose: boolean;
  showDoctor: boolean;
  doctorNameById: Record<string, string>;
};

/** How often to re-check the clock, so the day advances without a refresh. */
const CLOCK_TICK_MS = 60_000;

function subscribeToClock(onChange: () => void) {
  const timer = setInterval(onChange, CLOCK_TICK_MS);
  return () => clearInterval(timer);
}

/**
 * The current minute, not the current instant — `getSnapshot` is called on
 * every render and must return something stable between ticks, or React spins.
 */
function clockMinute() {
  return Math.floor(Date.now() / CLOCK_TICK_MS);
}

/** Appointments the doctor is done with, for the rail's progress bar. */
function doneCount(reservations: Reservation[]): number {
  return reservations.filter(
    (row) => row.status === "completed" || row.status === "no_show",
  ).length;
}

export function MyDayView({
  todaysReservations,
  directory,
  initialReservationId,
  initialBundle,
  currentDoctorId,
  canPickDoctor,
  canPropose,
  showDoctor,
  doctorNameById,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();

  // null = follow the clock. Set only when the doctor picks someone themselves,
  // which stops the page pulling the patient out from under them mid-treatment.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<MyDayPatientBundle | null>(initialBundle);
  const [billOpen, setBillOpen] = useState(false);
  const [tab, setTab] = useState<"history" | "chat">("history");
  const [loading, startLoading] = useTransition();

  // The server picked "now" on server time. Subscribing to the browser's clock
  // hands that decision to the doctor's own timezone, and keeps the day moving
  // on its own — null until hydration, so the server's pick renders first.
  const minute = useSyncExternalStore(subscribeToClock, clockMinute, () => null);
  const nowMs = minute === null ? null : minute * CLOCK_TICK_MS;
  const now = nowMs === null ? null : new Date(nowMs);

  const nowReservation = useMemo(
    () => (now ? pickCurrentReservation(todaysReservations, now) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `now` is derived from `minute`
    [todaysReservations, minute],
  );

  const selectedId =
    pinnedId ?? nowReservation?.id ?? initialReservationId ?? null;
  const selected =
    todaysReservations.find((row) => row.id === selectedId) ?? null;

  const group = useMemo(() => {
    if (!selected) return null;
    const key = patientKeyFromReservation(selected);
    return getPatientGroup(directory, key);
  }, [selected, directory]);

  const load = useCallback(
    (forGroup: PatientGroup) => {
      startLoading(async () => {
        try {
          const next = await loadMyDayPatientBundle({
            patientKey: forGroup.patientKey,
            phone: forGroup.phone,
            reservationIds: forGroup.visits.map((v) => v.id),
          });
          setBundle(next);
        } catch {
          toast.error(t("admin.myDay.loadFailed"));
        }
      });
    },
    [t],
  );

  // Fetch whenever the shown patient isn't the one we have data for — covers
  // both a manual switch and the clock rolling on to the next appointment.
  useEffect(() => {
    if (!group) return;
    if (bundle?.patientKey === group.patientKey) return;
    load(group);
  }, [group, bundle?.patientKey, load]);

  if (!selected || !group) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] px-4 py-20 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-[var(--admin-hover)] text-[var(--admin-muted)]">
          <CalendarOff className="size-5" />
        </span>
        <p className="mt-3 text-base font-semibold text-[var(--admin-text)]">
          {t("admin.myDay.noAppointments")}
        </p>
        <p className="mt-1 max-w-sm text-sm text-[var(--admin-muted)]">
          {t("admin.myDay.noAppointmentsHint")}
        </p>
      </div>
    );
  }

  const stale = !bundle || bundle.patientKey !== group.patientKey;
  const total = todaysReservations.length;
  const done = doneCount(todaysReservations);
  const dayDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[20rem_minmax(0,1fr)]">
      <aside className="flex min-h-0 min-w-0 flex-col gap-2 xl:overflow-y-auto">
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--admin-text)]">
              {t("admin.myDay.today")}
            </p>
            <p className="text-[11px] text-[var(--admin-muted)]">
              {total} {t("admin.myDay.appointments")}
            </p>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-[var(--admin-muted)]">
            {dayDate}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--admin-hover)]">
              <span
                className="block h-full rounded-full bg-[var(--admin-primary)] transition-[width]"
                style={{ width: total ? `${(done / total) * 100}%` : "0%" }}
              />
            </span>
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-[var(--admin-muted)]">
              {done}/{total} {t("admin.myDay.dayProgress")}
            </span>
          </div>
        </div>

        <MyDayScheduleList
          reservations={todaysReservations}
          selectedId={selectedId}
          nowId={nowReservation?.id ?? null}
          nowMs={nowMs}
          onSelect={(row) => setPinnedId(row.id)}
          showDoctor={showDoctor}
          doctorNameById={doctorNameById}
        />
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col gap-3">
        <MyDayPatientHeader
          group={group}
          reservation={selected}
          canPropose={canPropose}
          onBill={() => setBillOpen(true)}
        />

        <div className="relative flex min-h-0 flex-1 flex-col gap-3">
          {stale || loading ? (
            <div className="absolute inset-0 z-10 flex flex-col gap-3 bg-[var(--admin-canvas)]/70">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[0, 1, 2, 3].map((i) => (
                  <AdminSkeleton key={i} className="h-[4.5rem] w-full rounded-md" />
                ))}
              </div>
              <AdminSkeleton className="h-full min-h-40 w-full rounded-2xl" />
            </div>
          ) : null}

          {bundle ? (
            <>
              <MyDayStats
                balance={bundle.balance}
                treatments={bundle.treatments}
                imaging={bundle.imaging}
                visits={group.visits}
                currentVisitId={selected.id}
                currentVisitStartsAt={selected.starts_at}
              />
              <div className="flex shrink-0 gap-1">
                {(["history", "chat"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm transition",
                      tab === key
                        ? "bg-[var(--admin-primary)] text-white"
                        : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]",
                    )}
                  >
                    {t(key === "history" ? "admin.myDay.history" : "admin.myDay.chat")}
                  </button>
                ))}
              </div>

              {tab === "history" ? (
                <div className="min-h-0 flex-1 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] p-3">
                  <PatientEhrView
                    key={group.patientKey}
                    group={group}
                    treatments={bundle.treatments}
                    imaging={bundle.imaging}
                    notes={bundle.notes}
                    layout="stacked"
                  />
                </div>
              ) : (
                <div className="min-h-0 flex-1">
                  <MyDayPatientChat
                    key={group.patientKey}
                    messages={bundle.chat?.messages ?? []}
                    contactName={bundle.chat?.contactName ?? null}
                  />
                </div>
              )}
            </>
          ) : null}
        </div>
      </section>

      <BillPatientDialog
        open={billOpen}
        onOpenChange={setBillOpen}
        patientKey={group.patientKey}
        patientPhone={group.phone}
        patientName={group.displayName}
        reservations={group.visits}
        visit={{
          id: selected.id,
          serviceId: selected.service_id,
          serviceLabel: selected.service_label,
          startsAt: selected.starts_at,
          doctorId: selected.doctor_id,
        }}
        currentDoctorId={currentDoctorId}
        canPickDoctor={canPickDoctor}
      />
    </div>
  );
}
