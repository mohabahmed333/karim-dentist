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
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CalendarOff, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { toast } from "sonner";
import { AdminSkeleton } from "@/features/admin/components/AdminSkeleton";
import { useAdminSidebarCollapse } from "@/features/admin/hooks/useAdminSidebarCollapse";
import { BillPatientDialog } from "@/features/admin/components/billing/BillPatientDialog";
import {
  PatientProfileTabs,
  type PatientProfileTab,
} from "@/features/admin/components/patients/PatientProfileTabs";
import { PatientTabPanel } from "@/features/admin/components/patients/PatientTabPanel";
import { PatientWorkspaceView } from "@/features/admin/components/patients/workspace/PatientWorkspaceView";
import { pickCurrentReservation } from "@/features/admin/lib/dayScheduleModel";
import { createLocalPreference } from "@/features/admin/lib/localPreference";
import { patientTabTransition } from "@/features/admin/lib/patientTabMotion";
import { bundleForPatient } from "@/features/admin/lib/myDayBundle";
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
import {
  AdminSelect,
  AdminSelectContent,
  AdminSelectItem,
  AdminSelectTrigger,
  AdminSelectValue,
} from "@/features/admin/ui/AdminSelect";
import { MyDayPatientHeader } from "./MyDayPatientHeader";
import { MyDayRecordTabs } from "./MyDayRecordTabs";
import { MyDayScheduleList } from "./MyDayScheduleList";
import { MyDayStats } from "./MyDayStats";
import { isBillableVisit } from "@/services/reservations/billableVisit";

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

/** The chairside chart first, then the patient record's own four. */
const MY_DAY_TABS = [
  "chart",
  "information",
  "history",
  "next",
  "medical",
] as const satisfies readonly PatientProfileTab[];

/** Sentinel for "no filter" — a Select item cannot carry an empty value. */
const ALL_DOCTORS = "all";

/** How often to re-check the clock, so the day advances without a refresh. */
const CLOCK_TICK_MS = 60_000;

/** Remembered per browser; nothing here is worth a round trip. */
const railPreference = createLocalPreference("my-day:rail-collapsed");
const doctorPreference = createLocalPreference("my-day:doctor");

function railCollapsedSnapshot(): boolean {
  return railPreference.get() === "1";
}

function setRailCollapsed(next: boolean) {
  railPreference.set(next ? "1" : "0");
}

function pickedDoctorSnapshot(): string | null {
  return doctorPreference.get() || null;
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
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const searchParams = useSearchParams();

  // null = follow the clock. Set only when the doctor picks someone themselves,
  // which stops the page pulling the patient out from under them mid-treatment.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<MyDayPatientBundle | null>(initialBundle);
  const [tab, setTab] = useState<PatientProfileTab>("chart");
  const [billOpen, setBillOpen] = useState(false);
  const [loading, startLoading] = useTransition();

  // Floating is for the case where the admin sidebar is already eating the
  // width: then the schedule goes over the workspace instead of taking a
  // column too. With the sidebar collapsed there is room for both, so the rail
  // stays a plain column. Gated on `ready` so the server and the first client
  // render agree before the stored preference arrives.
  const { collapsed: sidebarCollapsed, ready: sidebarReady } =
    useAdminSidebarCollapse();
  const floatRail = sidebarReady && !sidebarCollapsed;

  const railCollapsed = useSyncExternalStore(
    railPreference.subscribe,
    railCollapsedSnapshot,
    () => false,
  );

  // Owner and front-desk accounts have no day of their own, so they choose
  // whose to look at. A doctor is always their own — the picker is hidden.
  const pickedDoctorId = useSyncExternalStore(
    doctorPreference.subscribe,
    pickedDoctorSnapshot,
    () => null,
  );
  const doctorFilter = canPickDoctor ? pickedDoctorId : null;

  const visibleReservations = useMemo(
    () =>
      doctorFilter
        ? todaysReservations.filter((row) => row.doctor_id === doctorFilter)
        : todaysReservations,
    [todaysReservations, doctorFilter],
  );

  // The server picked "now" on server time. Subscribing to the browser's clock
  // hands that decision to the doctor's own timezone, and keeps the day moving
  // on its own — null until hydration, so the server's pick renders first.
  const minute = useSyncExternalStore(subscribeToClock, clockMinute, () => null);
  const nowMs = minute === null ? null : minute * CLOCK_TICK_MS;
  const now = nowMs === null ? null : new Date(nowMs);

  const nowReservation = useMemo(
    () => (now ? pickCurrentReservation(visibleReservations, now) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `now` is derived from `minute`
    [visibleReservations, minute],
  );

  // A pin, or the server's first pick, can point at an appointment the doctor
  // filter has since hidden. Falling through to the clock keeps the screen on
  // a patient who is actually in the list rather than blanking it.
  const inView = (id: string | null) =>
    id && visibleReservations.some((row) => row.id === id) ? id : null;
  const selectedId =
    inView(pinnedId) ?? nowReservation?.id ?? inView(initialReservationId);
  const selected =
    visibleReservations.find((row) => row.id === selectedId) ?? null;

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

  /**
   * The loaded bundle, but only while it belongs to the patient on screen.
   *
   * `bundle` lags `group` by one fetch whenever the chair changes. Rendering
   * from it in the meantime showed the previous patient's record through the
   * translucent loading overlay — and worse, seeded the notes hook, which only
   * ever reads its `initial` argument, with the wrong patient's notes and then
   * kept them. Everything below reads this instead of `bundle`.
   */
  const activeBundle = bundleForPatient(bundle, group?.patientKey);

  // The treatment rows the workspace edits; the record tabs want them mapped.
  const treatmentItems = useMemo(
    () => (activeBundle?.treatments ?? []).map(toTreatmentItem),
    [activeBundle?.treatments],
  );

  const emptyDay = (
    <div className="flex h-full min-h-0 flex-1 flex-col items-center justify-center rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] px-4 py-20 text-center">
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

  const stale = activeBundle === null;
  const total = visibleReservations.length;
  const done = doneCount(visibleReservations);
  const dayDate = new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  // One list for both the value->label map and the rendered options: the
  // trigger showed raw ids when the map came up empty, and deriving both from
  // the same array is what stops them drifting apart again.
  const doctorOptions = [
    { value: ALL_DOCTORS, label: t("admin.myDay.allDoctors") },
    ...doctors.map((doctor) => ({
      value: doctor.id,
      label: doctor.display_name?.trim() || doctor.id,
    })),
  ];

  const doctorPicker =
    canPickDoctor && doctors.length > 0 ? (
      <div className="mt-2">
        <AdminSelect
          items={doctorOptions}
          value={pickedDoctorId ?? ALL_DOCTORS}
          onValueChange={(next) =>
            doctorPreference.set(next === ALL_DOCTORS ? null : next)
          }
        >
          <AdminSelectTrigger
            className="h-8 w-full text-xs"
            aria-label={t("admin.myDay.doctorFilter")}
          >
            <AdminSelectValue placeholder={t("admin.myDay.allDoctors")} />
          </AdminSelectTrigger>
          {/* No scroll arrows: Base UI pins them over the popup's edges the
              moment the list can scroll at all, which parked an opaque
              chevron band on top of the last doctor. A handful of names
              scrolls fine with the wheel and arrow keys. */}
          <AdminSelectContent
            alignItemWithTrigger={false}
            align="start"
            showScrollArrows={false}
            style={{ maxHeight: "18rem" }}
          >
            {doctorOptions.map((option) => (
              <AdminSelectItem key={option.value} value={option.value}>
                {option.label}
              </AdminSelectItem>
            ))}
          </AdminSelectContent>
        </AdminSelect>
      </div>
    ) : null;

  const dayHeader = (
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
      {doctorPicker}
    </>
  );

  const scheduleList = (
    <MyDayScheduleList
      reservations={visibleReservations}
      selectedId={selectedId}
      nowId={nowReservation?.id ?? null}
      nowMs={nowMs}
      onSelect={(row) => setPinnedId(row.id)}
      showDoctor={showDoctor}
      doctorNameById={doctorNameById}
    />
  );

  return (
    <div
      className={cn(
        // An explicit 1fr row, not the implicit auto one: auto-sized tracks
        // were sizing to their content instead of filling the column, so the
        // whole screen was only as tall as whatever the tab happened to hold
        // — and the rail, which spans `inset-y-0` of this grid, collapsed with
        // it, leaving the doctor popup no room to open into.
        "relative grid h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)] gap-3",
        "transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none",
        floatRail || railCollapsed
          ? "xl:grid-cols-[3.5rem_minmax(0,1fr)]"
          : "xl:grid-cols-[20rem_minmax(0,1fr)]",
      )}
    >
      <aside className="flex min-h-0 min-w-0 flex-col gap-2 xl:overflow-visible">
        <div className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <p
              className={cn(
                "text-sm font-semibold text-[var(--admin-text)]",
                (floatRail || railCollapsed) && "xl:hidden",
              )}
            >
              {t("admin.myDay.today")}
            </p>
            <button
              type="button"
              onClick={() => setRailCollapsed(!railCollapsed)}
              aria-controls="my-day-schedule"
              aria-expanded={!railCollapsed}
              title={t(
                railCollapsed
                  ? "admin.myDay.expandRail"
                  : "admin.myDay.collapseRail",
              )}
              className="ms-auto hidden shrink-0 rounded-md p-1 text-[var(--admin-muted)] transition-colors hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)] xl:inline-flex"
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

          {/* A 3.5rem strip has room for the count alone; the full header goes
              wherever the schedule itself is — inline, or in the float. */}
          <div className={cn((floatRail || railCollapsed) && "xl:hidden")}>
            {dayHeader}
          </div>
          <p
            className={cn(
              "mt-1 hidden text-center text-[11px] font-medium tabular-nums text-[var(--admin-muted)]",
              (floatRail || railCollapsed) && "xl:block",
            )}
          >
            {done}/{total}
          </p>
        </div>

        {/* Collapsing is an xl-only affordance (the toggle is hidden below it),
            so a state remembered from a wide screen must not hide the schedule
            on a narrow one — there would be no way to bring it back. */}
        <div
          id={floatRail ? undefined : "my-day-schedule"}
          className={cn(
            "transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none",
            floatRail
              ? "xl:hidden"
              : railCollapsed &&
                  "xl:pointer-events-none xl:-translate-x-6 xl:opacity-0 rtl:xl:translate-x-6",
          )}
          aria-hidden={!floatRail && railCollapsed}
        >
          {scheduleList}
        </div>
      </aside>

      {/* The floating schedule. Sits beside the strip and above the workspace,
          so opening it costs the chart nothing. */}
      <div
        id={floatRail ? "my-day-schedule" : undefined}
        aria-hidden={railCollapsed || !floatRail}
        className={cn(
          "absolute inset-y-0 z-20 hidden w-80",
          floatRail && "xl:flex xl:flex-col",
          "rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)] shadow-xl",
          "transition-[opacity,transform] duration-300 ease-out motion-reduce:transition-none",
          railCollapsed
            ? "pointer-events-none -translate-x-3 opacity-0 rtl:translate-x-3"
            : "pointer-events-auto translate-x-0 opacity-100",
        )}
        style={{ insetInlineStart: "calc(3.5rem + 0.75rem)" }}
      >
        <div className="shrink-0 border-b border-[var(--admin-border)] px-3 py-2.5">
          <p className="text-sm font-semibold text-[var(--admin-text)]">
            {t("admin.myDay.today")}
          </p>
          {dayHeader}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2">{scheduleList}</div>
      </div>

      <section className="flex min-h-0 min-w-0 flex-col gap-2">
        {!selected || !group ? (
          emptyDay
        ) : (
        <>
        <MyDayPatientHeader
          group={group}
          reservation={selected}
          canPropose={canPropose && isBillableVisit(selected)}
          conversationId={activeBundle?.whatsappConversationId ?? null}
          onBill={() => setBillOpen(true)}
        />

        <div className="relative flex min-h-0 flex-1 flex-col gap-2">
          {/* An overlay, not a block in the flow: the column holds its own
              height now, so the placeholder can sit over the area the record
              is about to fill and fade away when it arrives. The content
              underneath stays gated on the matching bundle, so what shows
              through is empty canvas rather than the previous patient. */}
          <AnimatePresence initial={false}>
            {stale || loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: reducedMotion ? 1 : 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: reducedMotion ? 1 : 0 }}
                transition={patientTabTransition(reducedMotion)}
                className="absolute inset-0 z-10 flex flex-col gap-3 bg-[var(--admin-canvas)]/70"
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <AdminSkeleton
                      key={i}
                      className="h-[4.5rem] w-full rounded-md"
                    />
                  ))}
                </div>
                <AdminSkeleton className="min-h-40 w-full flex-1 rounded-2xl" />
              </motion.div>
            ) : null}
          </AnimatePresence>

          {activeBundle ? (
            <>
              <MyDayStats
                balance={activeBundle.balance}
                treatments={treatmentItems}
                imaging={activeBundle.imaging}
                visits={group.visits}
                currentVisitId={selected.id}
                currentVisitStartsAt={selected.starts_at}
              />

              <div className="shrink-0 ps-3">
                <PatientProfileTabs
                  tabs={MY_DAY_TABS}
                  active={tab}
                  onChange={setTab}
                />
              </div>

              {/* Every pane here is heavy — a 3D odontogram on the chart, a
                  second one on the medical record — so only the active tab is
                  mounted. The chart is one surface and gets the panel chrome;
                  the record tabs bring their own cards, so they scroll against
                  the canvas instead of sitting in a card inside a card. */}
              <div
                className={cn(
                  "min-h-0 flex-1",
                  tab === "chart"
                    ? "overflow-hidden rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-panel)]"
                    : "overflow-y-auto pb-4",
                )}
              >
                <PatientTabPanel
                  tab={tab}
                  className={tab === "chart" ? "h-full" : undefined}
                >
                {tab === "chart" ? (
                  <PatientWorkspaceView
                    key={group.patientKey}
                    embedded
                    showHeader={false}
                    group={group}
                    notes={activeBundle.notes}
                    imaging={activeBundle.imaging}
                    treatments={activeBundle.treatments}
                    services={services}
                    directory={directory}
                    doctors={doctors}
                    serviceDoctorMappings={serviceDoctorMappings}
                    canPropose={canPropose}
                    canBook={canBook}
                    canEditProfile={canEditProfile}
                    canEditBilling={canEditBilling}
                    billingBalance={activeBundle.balance}
                    currentDoctorId={currentDoctorId}
                    canPickDoctor={canPickDoctor}
                  />
                ) : (
                  <MyDayRecordTabs
                    key={group.patientKey}
                    tab={tab}
                    group={group}
                    treatments={treatmentItems}
                    notes={activeBundle.notes}
                    doctorNameById={doctorNameById}
                  />
                )}
                </PatientTabPanel>
              </div>
            </>
          ) : null}
        </div>

        <BillPatientDialog
          open={billOpen}
          onOpenChange={setBillOpen}
          patientKey={group.patientKey}
          patientPhone={group.phone}
          patientName={group.displayName}
          reservations={group.visits}
        treatments={treatmentItems}
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
        </>
        )}
      </section>
    </div>
  );
}
