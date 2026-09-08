"use client";

import type { ReactNode } from "react";
import type { Reservation } from "@/services/reservations/types";
import type { ReservationStats } from "@/services/reservations/stats";
import type {
  AttentionItem,
  DashboardKpi,
} from "@/features/admin/lib/dashboardModel";
import type { Service } from "@/services/services/types";
import type { WhatsappConversation } from "@/services/whatsapp/types";
import type { DashboardWidgetId } from "@/features/admin/lib/dashboardLayout";
import { DashboardAttentionCard } from "./DashboardAttentionCard";
import { DashboardKpiCard } from "./DashboardKpiCard";
import { DashboardBookingsPanel } from "./DashboardBookingsPanel";
import { DashboardRecentPanel } from "./DashboardRecentPanel";
import { DashboardSchedulePanel } from "./DashboardSchedulePanel";
import { DashboardMessagesPanel } from "./DashboardMessagesPanel";
import { DashboardDaySchedule } from "./DashboardDaySchedule";
import { DashboardPendingQueuePanel } from "./DashboardPendingQueuePanel";
import { DashboardTodayPatientsPanel } from "./DashboardTodayPatientsPanel";
import { DashboardTopServicesPanel } from "./DashboardTopServicesPanel";
import { DashboardNextAppointmentCard } from "./DashboardNextAppointmentCard";
import {
  ChartBookingMix,
  ChartBusyHours,
  ChartDayTrend,
  ChartStatusMix,
  ChartVisitsWeek,
} from "./DashboardCharts";
import {
  ChartCancelRate,
  ChartServiceRank,
  ChartWeekCompare,
} from "./DashboardExtraCharts";

export type DashboardWidgetRenderCtx = {
  reservations: Reservation[];
  coverageFrom: string;
  coverageTo: string;
  services: Service[];
  attention: AttentionItem[];
  kpis: DashboardKpi[];
  stats: ReservationStats;
  conversations: WhatsappConversation[];
  onPatientSelect: (reservation: Reservation) => void;
  emptyAttention: string;
};

const KPI_BY_WIDGET: Partial<
  Record<DashboardWidgetId, { labelKey: DashboardKpi["labelKey"]; icon: number }>
> = {
  kpiTodayVisits: { labelKey: "admin.overview.kpi.todayVisits", icon: 0 },
  kpiPending: { labelKey: "admin.overview.kpi.pending", icon: 1 },
  kpiConfirmedWeek: { labelKey: "admin.overview.kpi.confirmedWeek", icon: 2 },
  kpiServices: { labelKey: "admin.overview.kpi.services", icon: 3 },
  kpiCancelled: { labelKey: "admin.overview.kpi.cancelled", icon: 1 },
  kpiNoShow: { labelKey: "admin.overview.kpi.noShow", icon: 1 },
  kpiCompleted: { labelKey: "admin.overview.kpi.completed", icon: 2 },
  kpiTomorrow: { labelKey: "admin.overview.kpi.tomorrow", icon: 0 },
  kpiWeekTotal: { labelKey: "admin.overview.kpi.weekTotal", icon: 0 },
  kpiUnreadChats: { labelKey: "admin.overview.kpi.unreadChats", icon: 3 },
};

const ATTENTION_BY_WIDGET: Partial<Record<DashboardWidgetId, string>> = {
  attentionPending: "pending",
  attentionToday: "today",
  attentionCancelled: "cancelled",
  attentionNoShow: "noShow",
};

export function renderDashboardWidget(
  id: DashboardWidgetId,
  ctx: DashboardWidgetRenderCtx,
): ReactNode {
  const attentionKey = ATTENTION_BY_WIDGET[id];
  if (attentionKey) {
    return (
      <DashboardAttentionCard
        item={ctx.attention.find((a) => a.id === attentionKey) ?? null}
        emptyLabel={ctx.emptyAttention}
      />
    );
  }

  const kpiMeta = KPI_BY_WIDGET[id];
  if (kpiMeta) {
    const item = ctx.kpis.find((k) => k.labelKey === kpiMeta.labelKey);
    if (!item) return null;
    return <DashboardKpiCard item={item} iconIndex={kpiMeta.icon} />;
  }

  switch (id) {
    case "daySchedule":
      return (
        <DashboardDaySchedule
          reservations={ctx.reservations}
          coverageFrom={ctx.coverageFrom}
          coverageTo={ctx.coverageTo}
          services={ctx.services}
          onPatientSelect={ctx.onPatientSelect}
        />
      );
    case "bookings":
      return (
        <DashboardBookingsPanel
          reservations={ctx.reservations}
          services={ctx.services}
          onPatientSelect={ctx.onPatientSelect}
        />
      );
    case "recent":
      return (
        <DashboardRecentPanel
          reservations={ctx.reservations}
          services={ctx.services}
          onPatientSelect={ctx.onPatientSelect}
        />
      );
    case "schedule":
      return (
        <DashboardSchedulePanel
          reservations={ctx.reservations}
          services={ctx.services}
          onPatientSelect={ctx.onPatientSelect}
        />
      );
    case "messages":
      return <DashboardMessagesPanel conversations={ctx.conversations} />;
    case "listPending":
      return (
        <DashboardPendingQueuePanel
          reservations={ctx.reservations}
          onPatientSelect={ctx.onPatientSelect}
        />
      );
    case "listToday":
      return (
        <DashboardTodayPatientsPanel
          reservations={ctx.reservations}
          onPatientSelect={ctx.onPatientSelect}
        />
      );
    case "listTopServices":
      return <DashboardTopServicesPanel serviceMix={ctx.stats.serviceMix} />;
    case "listNextAppointment":
      return <DashboardNextAppointmentCard reservations={ctx.reservations} />;
    case "chartVisitsWeek":
      return <ChartVisitsWeek weekCounts={ctx.stats.weekCounts} />;
    case "chartBookingMix":
      return <ChartBookingMix serviceMix={ctx.stats.serviceMix} />;
    case "chartStatus":
      return <ChartStatusMix statusMix={ctx.stats.statusMix} />;
    case "chartBusyHours":
      return <ChartBusyHours hourCounts={ctx.stats.hourCounts} />;
    case "chartDayTrend":
      return <ChartDayTrend dayTrend={ctx.stats.dayTrend} />;
    case "chartWeekCompare":
      return (
        <ChartWeekCompare
          weekCounts={ctx.stats.weekCounts}
          lastWeekCounts={ctx.stats.lastWeekCounts}
        />
      );
    case "chartCancelRate":
      return (
        <ChartCancelRate
          cancelRatePercent={ctx.stats.cancelRatePercent}
          cancelledCount={ctx.stats.cancelledCount}
        />
      );
    case "chartServiceRank":
      return <ChartServiceRank serviceMix={ctx.stats.serviceMix} />;
    default:
      return null;
  }
}
