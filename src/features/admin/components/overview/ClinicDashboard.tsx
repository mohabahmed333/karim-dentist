"use client";

import { useState, type ReactNode } from "react";
import type { Reservation } from "@/services/reservations/types";
import type { ReservationStats } from "@/services/reservations/stats";
import type {
  AttentionItem,
  DashboardKpi,
} from "@/features/admin/lib/dashboardModel";
import type { Service } from "@/services/services/types";
import { AdminReservationFilters } from "@/features/admin/components/AdminReservationFilters";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { useQuickBook } from "@/features/admin/components/quick-book/QuickBookContext";
import { useTranslations } from "@/lib/i18n";
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardAttention } from "./DashboardAttention";
import { DashboardKpis } from "./DashboardKpis";
import { DashboardBookingsPanel } from "./DashboardBookingsPanel";
import { DashboardRecentPanel } from "./DashboardRecentPanel";
import { DashboardSchedulePanel } from "./DashboardSchedulePanel";
import { DashboardDaySchedule } from "./DashboardDaySchedule";
import { DashboardCharts } from "./DashboardCharts";
import { DashboardPageSkeleton } from "./DashboardPageSkeleton";
import { HomePatientClinicDrawer } from "./HomePatientClinicDrawer";

type Props = {
  email: string | null;
  displayName: string;
  reservations: Reservation[];
  services: Service[];
  attention: AttentionItem[];
  kpis: DashboardKpi[];
  stats: ReservationStats;
};

export function ClinicDashboard({
  email,
  displayName,
  reservations,
  services,
  attention,
  kpis,
  stats,
}: Props) {
  const t = useTranslations();
  const { openQuickBook } = useQuickBook();
  const [clinicReservation, setClinicReservation] =
    useState<Reservation | null>(null);
  const [filtering, setFiltering] = useState(false);

  const body: ReactNode = filtering ? (
    <DashboardPageSkeleton />
  ) : (
    [
      <DashboardAttention key="attention" items={attention} />,
      <DashboardKpis key="kpis" items={kpis} />,
      <DashboardDaySchedule
        key="day"
        reservations={reservations}
        onPatientSelect={setClinicReservation}
      />,
      <div key="panels" className="grid gap-3 lg:grid-cols-3 lg:items-stretch">
        <div className="min-h-[22rem]">
          <DashboardBookingsPanel
            reservations={reservations}
            onPatientSelect={setClinicReservation}
          />
        </div>
        <div className="min-h-[22rem]">
          <DashboardRecentPanel
            reservations={reservations}
            onPatientSelect={setClinicReservation}
          />
        </div>
        <div className="min-h-[22rem]">
          <DashboardSchedulePanel
            reservations={reservations}
            onPatientSelect={setClinicReservation}
          />
        </div>
      </div>,
      <DashboardCharts
        key="charts"
        weekCounts={stats.weekCounts}
        serviceMix={stats.serviceMix}
      />,
      <p
        key="link"
        className="pb-2 text-center text-xs text-[var(--admin-muted)]"
      >
        <a
          href="/admin/reservations"
          className="font-medium text-[var(--admin-primary)] hover:underline"
        >
          {t("admin.reservations.title")}
        </a>
      </p>,
    ]
  );

  return (
    <>
      <AdminPageMotion className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <DashboardGreeting
            email={email}
            displayName={displayName}
            reservations={reservations}
          />
          <div className="flex flex-col items-stretch gap-3 sm:items-end">
            <button
              type="button"
              onClick={() => openQuickBook()}
              className="inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium text-white hover:opacity-90"
              style={{ background: "var(--admin-primary)" }}
            >
              {t("admin.reservations.new")}
            </button>
            <AdminReservationFilters
              services={services}
              showCompare
              onPendingChange={setFiltering}
            />
          </div>
        </div>
        {body}
      </AdminPageMotion>

      <HomePatientClinicDrawer
        open={clinicReservation !== null}
        reservation={clinicReservation}
        reservations={reservations}
        onClose={() => setClinicReservation(null)}
      />
    </>
  );
}
