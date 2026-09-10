"use client";

import type { DashboardKpi } from "@/features/admin/lib/dashboardModel";
import { useWhatsappConversationsLive } from "@/features/admin/hooks/useWhatsappConversationsLive";
import type { WhatsappConversation } from "@/services/whatsapp/types";
import { DashboardKpiCard } from "./DashboardKpiCard";

type Props = {
  item: DashboardKpi;
  iconIndex?: number;
  conversations: WhatsappConversation[];
};

export function DashboardUnreadChatsKpi({
  item,
  iconIndex,
  conversations,
}: Props) {
  const live = useWhatsappConversationsLive(conversations);
  const unread = live.reduce((sum, row) => sum + (row.unread_count ?? 0), 0);
  return (
    <DashboardKpiCard
      item={{
        ...item,
        value: String(unread),
        up: unread === 0,
      }}
      iconIndex={iconIndex}
    />
  );
}
