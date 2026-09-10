import {
  buildAttentionItems,
  buildDashboardKpis,
} from "@/features/admin/lib/dashboardModel";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  cloneDashboardLayout,
} from "@/features/admin/lib/dashboardLayout";
import { buildReservationStats } from "@/services/reservations/stats";
import { buildShowreelConversations } from "./buildShowreelConversations";
import {
  buildShowreelReservations,
  buildShowreelServices,
} from "./buildShowreelReservations";

function dayBounds() {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + 3);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function buildShowreelDashboardProps() {
  const reservations = buildShowreelReservations();
  const services = buildShowreelServices();
  const conversations = buildShowreelConversations();
  const coverage = dayBounds();
  const unreadChats = conversations.reduce(
    (sum, row) => sum + (row.unread_count ?? 0),
    0,
  );

  return {
    email: "admin@dentallounge.local",
    displayName: "Karim",
    reservations,
    coverageFrom: coverage.from,
    coverageTo: coverage.to,
    services,
    attention: buildAttentionItems(reservations),
    kpis: buildDashboardKpis(reservations, services.length, unreadChats),
    stats: buildReservationStats(reservations),
    conversations,
    settings: null,
    initialLayout: cloneDashboardLayout(DEFAULT_DASHBOARD_LAYOUT),
  };
}
