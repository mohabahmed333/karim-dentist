"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarOff, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import { BillPatientDialog } from "@/features/admin/components/billing/BillPatientDialog";
import { PatientEhrView } from "@/features/admin/components/patients/ehr-view/PatientEhrView";
import { PatientWorkspaceView } from "@/features/admin/components/patients/workspace/PatientWorkspaceView";
import { pickCurrentReservation } from "@/features/admin/lib/dayScheduleModel";
import {
  getPatientGroup,
  patientKeyFromReservation,
  type PatientGroup,
} from "@/services/reservations/patientHistory";
import type { Reservation } from "@/services/reservations/types";
import { toTreatmentItem } from "@/services/patient_treatments";
import type { PriceableDoctor } from "@/services/service_doctors/pricing";
import type { ServiceDoctorMapping } from "@/services/service_doctors/queries";
import type { Service } from "@/services/services/types";
import {
  loadMyDayPatientBundle,
  type MyDayPatientBundle,
} from "@/services/my_day/actions";
import { useLocale, useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
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
  canEditBilling: boolean;
  canBook: boolean;
  canEditProfile: boolean;
  showDoctor: boolean;
  doctorNameById: Record<string, string>;
  doctors: PriceableDoctor[];
  services: Service[];
  serviceDoctorMappings: Record<string, ServiceDoctorMapping[]>;
};

type Tab = "chart" | "history";

/** How often to re-check the clock, so the day advances without a refresh. */
const CLOCK_TICK_MS = 60_000;

/** Remembers the rail state per browser; nothing here is worth a round trip. */
const RAIL_KEY = "my-day:rail-collapsed";

/**
 * The rail's collapsed flag, as an external store.
 *
 * `localStorage` does not exist while rendering on the server, so this cannot
 * be plain state seeded from it. `useSyncExternalStore` is the shape React
 * provides for exactly that: hydrate from `getServerSnapshot`, then re-render
 * against the real value — no setState in an effect, and no hydration mismatch.
 */
const railListeners = new Set<() => void>();
let railCache: boolean | null = null;

function subscribeToRail(onChange: () => void) {
  railListeners.add(onChange);
  return () => {
    railListeners.delete(onChange);
  };
}

function railCollapsedSnapshot(): boolean {
  if (railCache === null) {
    try {
      railCache = window.localStorage.getItem(RAIL_KEY) === "1";
    } catch {
      // Private mode or blocked storage — expanded is the safe default.
      railCache = false;
    }
  }
  return railCache;
}

function setRailCollapsed(next: boolean) {
  railCache = next;
  try {
    window.localStorage.setItem(RAIL_KEY, next ? "1" : "0");
  } catch {
    // Not worth surfacing; the rail still toggles for this session.
  }
  for (const listener of railListeners) listener();
}

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
  canEditBilling,
  canBook,
  canEditProfile,
  showDoctor,
  doctorNameById,
  doctors,
  services,
  serviceDoctorMappings,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // null = follow the clock. Set only when the doctor picks someone themselves,
  // which stops the page pulling the patient out from under them mid-treatment.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<MyDayPatientBundle | null>(initialBundle);
  const [tab, setTab] = useState<Tab>("chart");
  const [billOpen, setBillOpen] = useState(false);
  const [loading, startLoading] = useTransition();

  const railCollapsed = useSyncExternalStore(
    subscribeToRail,
    railCollapsedSnapshot,
    () => false,
  );

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

  // The workspace keeps the selected tooth in `?tooth=`. It is meaningless for
  // the next patient, so drop it when the chair changes — otherwise tooth 26
  // stays selected as the whole chart underneath it is replaced.
  const patientKey = group?.patientKey ?? null;
  useEffect(() => {
    if (!patientKey) return;
    if (!searchParams.has("tooth")) return;
    const next = new URLSearchParams(searchParams);
    next.delete("tooth");
    const query = next.toString();
    router.replace(query ? `?${query}` : "?", { scroll: false });
    // Keyed on the patient alone: this should fire when the chair changes, not
    // every time the tooth param itself does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientKey]);

  // The treatment rows the workspace edits; the history tab wants them mapped.
  const treatmentItems = useMemo(
    () => (bundle?.treatments ?? []).map(toTreatmentItem),
    [bundle?.treatments],
  );

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
    <div
      className={cn(
        "grid min-h-0 flex-1 gap-3",
        railCollapsed ? "xl:grid-cols-[3.5rem_minmax(0,1fr)]" : "xl:grid-cols-[20rem_minmax(0,1fr)]",
      )}
    >
      <aside className="flex min-h-0 min-w-0 flex-col gap-2 xl:overflow-y-auto">
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            {!railCollapsed ? (
              <p className="text-sm font-semibold text-[var(--admin-text)]">
                {t("admin.myDay.today")}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => setRailCollapsed(!railCollapsed)}
              aria-expanded={!railCollapsed}
              title={t(
                railCollapsed
                  ? "admin.myDay.expandRail"
                  : "admin.myDay.collapseRail",
              )}
              className="ms-auto hidden shrink-0 rounded-md p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] xl:inline-flex"
            >
              {railCollapsed ? (
                <PanelLeftOpen className="size-4" />
              ) : (
                <PanelLeftClose className="size-4" />
              )}
              <span className="sr-only">
                {t(
                  railCollapsed
                    ? "admin.myDay.expandRail"
                    : "admin.myDay.collapseRail",
                )}
              </span>
            </button>
          </div>

          {!railCollapsed ? (
            <>
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
            </>
          ) : (
            <p className="mt-1 text-center text-[11px] font-medium tabular-nums text-[var(--admin-muted)]">
              {done}/{total}
            </p>
          )}
        </div>

        {/* Collapsing is an xl-only affordance (the toggle is hidden below it),
            so a state remembered from a wide screen must not hide the schedule
            on a narrow one — there would be no way to bring it back. */}
        <div className={cn(railCollapsed && "xl:hidden")}>
          <MyDayScheduleList
            reservations={todaysReservations}
            selectedId={selectedId}
            nowId={nowReservation?.id ?? null}
            nowMs={nowMs}
            onSelect={(row) => setPinnedId(row.id)}
            showDoctor={showDoctor}
            doctorNameById={doctorNameById}
          />
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col gap-2">
        <MyDayPatientHeader
          group={group}
          reservation={selected}
          canPropose={canPropose}
          conversationId={bundle?.whatsappConversationId ?? null}
          onBill={() => setBillOpen(true)}
        />

        <div className="relative flex min-h-0 flex-1 flex-col gap-2">
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
                treatments={treatmentItems}
                imaging={bundle.imaging}
                visits={group.visits}
                currentVisitId={selected.id}
                currentVisitStartsAt={selected.starts_at}
              />

              <div className="flex shrink-0 gap-1">
                {(["chart", "history"] as const).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    aria-current={tab === key ? "true" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm transition",
                      tab === key
                        ? "bg-[var(--admin-primary)] text-white"
                        : "text-[var(--admin-muted)] hover:bg-[var(--admin-hover)]",
                    )}
                  >
                    {t(
                      key === "chart"
                        ? "admin.myDay.chart"
                        : "admin.myDay.history",
                    )}
                  </button>
                ))}
              </div>

              {/* Both panes are heavy — a 3D odontogram on one side, the EHR
                  arch on the other — so only the active tab is mounted. */}
              <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)]">
                {tab === "chart" ? (
                  <PatientWorkspaceView
                    key={group.patientKey}
                    embedded
                    showHeader={false}
                    group={group}
                    notes={bundle.notes}
                    imaging={bundle.imaging}
                    treatments={bundle.treatments}
                    services={services}
                    directory={directory}
                    doctors={doctors}
                    serviceDoctorMappings={serviceDoctorMappings}
                    canPropose={canPropose}
                    canBook={canBook}
                    canEditProfile={canEditProfile}
                    canEditBilling={canEditBilling}
                    billingBalance={bundle.balance}
                    currentDoctorId={currentDoctorId}
                    canPickDoctor={canPickDoctor}
                  />
                ) : (
                  <div className="h-full p-3">
                    <PatientEhrView
                      key={group.patientKey}
                      group={group}
                      treatments={treatmentItems}
                      imaging={bundle.imaging}
                      notes={bundle.notes}
                      layout="stacked"
                    />
                  </div>
                )}
              </div>
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
