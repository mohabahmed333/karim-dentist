"use client";

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
import { renderDashboardWidget } from "./renderDashboardWidget";

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

export function DashboardWidgetHost(props: DashboardWidgetHostProps) {
  const t = useTranslations();
  const { id, className, ...rest } = props;
  const body = renderDashboardWidget(id, {
    ...rest,
    emptyAttention: t("admin.overview.customize.cardEmpty"),
  });

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="min-h-0 flex-1 *:h-full *:min-h-0">{body}</div>
    </div>
  );
}
