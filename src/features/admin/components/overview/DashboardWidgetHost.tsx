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
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DashboardAttentionCard } from "./DashboardAttentionCard";
import { DashboardKpiCard } from "./DashboardKpiCard";
import { DashboardBookingsPanel } from "./DashboardBookingsPanel";
import { DashboardRecentPanel } from "./DashboardRecentPanel";
import { DashboardSchedulePanel } from "./DashboardSchedulePanel";
import { DashboardMessagesPanel } from "./DashboardMessagesPanel";
import { DashboardDaySchedule } from "./DashboardDaySchedule";
import {
  ChartBookingMix,
  ChartBusyHours,
  ChartDayTrend,
  ChartStatusMix,
  ChartVisitsWeek,
} from "./DashboardCharts";

export type DashboardWidgetHostProps = {
  id: DashboardWidgetId;
  reservations: Reservation[];
  coverageFrom: string;
  coverageTo: string;
  services: Service[];
  attention: AttentionItem[];
  kpis: DashboardKpi[];
  stats: ReservationStats;
  conversations: WhatsappConversation[];
  onPatientSelect: (reservation: Reservation) => void;
  className?: string;
};

const KPI_BY_WIDGET: Partial<
  Record<DashboardWidgetId, { labelKey: DashboardKpi["labelKey"]; icon: number }>
> = {
  kpiTodayVisits: {
    labelKey: "admin.overview.kpi.todayVisits",
    icon: 0,
  },
  kpiPending: { labelKey: "admin.overview.kpi.pending", icon: 1 },
  kpiConfirmedWeek: {
    labelKey: "admin.overview.kpi.confirmedWeek",
    icon: 2,
  },
  kpiServices: { labelKey: "admin.overview.kpi.services", icon: 3 },
};

const ATTENTION_BY_WIDGET: Partial<Record<DashboardWidgetId, string>> = {
  attentionPending: "pending",
  attentionToday: "today",
};

export function DashboardWidgetHost(props: DashboardWidgetHostProps) {
  const t = useTranslations();
  const {
    id,
    reservations,
    coverageFrom,
    coverageTo,
    services,
    attention,
    kpis,
    stats,
    conversations,
    onPatientSelect,
    className,
  } = props;

  const body = renderWidget(id, {
    reservations,
    coverageFrom,
    coverageTo,
    services,
    attention,
    kpis,
    stats,
    conversations,
    onPatientSelect,
    emptyAttention: t("admin.overview.customize.cardEmpty"),
  });

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 *:h-full *:min-h-0">{body}</div>
    </div>
  );
}

function renderWidget(
  id: DashboardWidgetId,
  ctx: Omit<DashboardWidgetHostProps, "id" | "className"> & {
    emptyAttention: string;
  },
): ReactNode {
  const attentionKey = ATTENTION_BY_WIDGET[id];
  if (attentionKey) {
    const item =
      ctx.attention.find((a) => a.id === attentionKey) ?? null;
    return (
      <DashboardAttentionCard
        item={item}
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
    default:
      return null;
  }
}
