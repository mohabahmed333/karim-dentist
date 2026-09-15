"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import { BillPatientDialog } from "@/features/admin/components/billing/BillPatientDialog";
import { PatientEhrView } from "@/features/admin/components/patients/ehr-view/PatientEhrView";
import { pickCurrentReservation } from "@/features/admin/lib/dayScheduleModel";
import {
  getPatientGroup,
  patientKeyFromReservation,
  patientWorkspacePath,
  type PatientGroup,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import {
  loadMyDayPatientBundle,
  type MyDayPatientBundle,
} from "@/services/my_day/actions";
import { formatEgp } from "@/services/deposits/receiptMessages";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { MyDayPatientChat } from "./MyDayPatientChat";
import { MyDayScheduleList } from "./MyDayScheduleList";

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
  const [tab, setTab] = useState<"history" | "chat">("history");
  const [billOpen, setBillOpen] = useState(false);
  const [loading, startLoading] = useTransition();

  // The server picked "now" on server time. Subscribing to the browser's clock
  // hands that decision to the doctor's own timezone, and keeps the day moving
  // on its own — null until hydration, so the server's pick renders first.
  const minute = useSyncExternalStore(subscribeToClock, clockMinute, () => null);
  const now = minute === null ? null : new Date(minute * CLOCK_TICK_MS);

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
      <p className="rounded-2xl border border-[var(--admin-border)] px-4 py-16 text-center text-sm text-[var(--admin-muted)]">
        {t("admin.myDay.noAppointments")}
      </p>
    );
  }

  const stale = !bundle || bundle.patientKey !== group.patientKey;
  const balance = bundle?.balance ?? 0;

  const chat = (
    <MyDayPatientChat
      messages={bundle?.chat?.messages ?? []}
      contactName={bundle?.chat?.contactName ?? null}
    />
  );

  return (
    <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[18rem_minmax(0,1fr)_22rem]">
      <aside className="min-w-0 xl:overflow-y-auto">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--admin-muted)]">
          {t("admin.myDay.today")}
        </p>
        <MyDayScheduleList
          reservations={todaysReservations}
          selectedId={selectedId}
          nowId={nowReservation?.id ?? null}
          onSelect={(row) => setPinnedId(row.id)}
          showDoctor={showDoctor}
          doctorNameById={doctorNameById}
        />
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col gap-3">
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-[var(--admin-border)] px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-[var(--admin-text)]">
              {group.displayName}
            </p>
            <p className="truncate text-xs text-[var(--admin-muted)]">
              {[group.phone, selected.service_label].filter(Boolean).join(" · ")}
            </p>
          </div>

          <span
            className={cn(
              "ms-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
              balance > 0
                ? "bg-red-50 text-red-600"
                : "bg-emerald-50 text-emerald-600",
            )}
          >
            {t("admin.myDay.balanceOwed")}: {formatEgp(Math.abs(balance), locale)}
          </span>

          {canPropose ? (
            <Button type="button" size="sm" onClick={() => setBillOpen(true)}>
              {t("admin.billing.billVisit")}
            </Button>
          ) : null}
          <Link
            href={patientWorkspacePath(group.patientKey)}
            className="shrink-0 rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-hover)]"
          >
            {t("admin.myDay.openWorkspace")}
          </Link>
        </header>

        {/* Chat gets its own column on a wide screen; below that it shares this
            one as a tab, so the schedule stays visible — it is how you switch. */}
        <div className="flex shrink-0 gap-1 xl:hidden">
          {(["history", "chat"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm",
                tab === key
                  ? "bg-[var(--admin-primary)] text-white"
                  : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]",
              )}
            >
              {t(key === "history" ? "admin.myDay.history" : "admin.myDay.chat")}
            </button>
          ))}
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          {stale || loading ? (
            <div className="absolute inset-0 z-10 flex flex-col gap-2 bg-[var(--admin-canvas)]/70 p-2">
              <AdminSkeleton className="h-40 w-full rounded-2xl" />
              <AdminSkeleton className="h-24 w-full rounded-2xl" />
            </div>
          ) : null}

          <div className={cn("min-h-0 flex-1", tab === "chat" && "xl:block hidden")}>
            {bundle ? (
              <PatientEhrView
                key={group.patientKey}
                group={group}
                treatments={bundle.treatments}
                imaging={bundle.imaging}
                notes={bundle.notes}
                layout="stacked"
              />
            ) : null}
          </div>

          {tab === "chat" ? (
            <div className="min-h-0 flex-1 xl:hidden">{chat}</div>
          ) : null}
        </div>
      </section>

      <aside className="hidden min-h-0 min-w-0 xl:block">{chat}</aside>

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
