import { createClient } from "@/lib/supabase/server";
import { ClinicDashboard } from "@/features/admin/components/overview/ClinicDashboard";
import {
  buildAttentionItems,
  buildBillingInventoryKpis,
  buildDashboardKpis,
  DASHBOARD_LIST_LIMIT,
  firstNameFromEmail,
} from "@/features/admin/lib/dashboardModel";
import { expandCoverageThroughAfterTomorrow } from "@/features/admin/lib/dayScheduleModel";
import {
  defaultOverviewFromTo,
  reservationFiltersCache,
  resolveReservationFilters,
} from "@/features/admin/lib/reservationFilters";
import { listReservationsServer } from "@/services/reservations/queries";
import { buildReservationStats } from "@/services/reservations/stats";
import { listConversations } from "@/services/whatsapp/queries";
import { listDoctorProductionThisWeek } from "@/services/patient_treatments/queries";
import { requirePagePermission } from "@/lib/auth/pageGuard";
import { hasPermission } from "@/lib/auth/permissions";
import {
  DEFAULT_DASHBOARD_LAYOUT,
  normalizeDashboardLayout,
} from "@/features/admin/lib/overview/overviewDashboardLayout";
import {
  listPatientBalances,
  listWeekPayments,
  sumOutstandingBalance,
} from "@/services/patient_billing/queries";
import type {
  PatientBalance,
  WeekPaymentRow,
} from "@/services/patient_billing/types";
import {
  listPendingBillingPayments,
  type BillingPaymentQueueRow,
} from "@/services/billing_payments/queries";
import {
  countLowStockItems,
  countPendingApprovals,
  getStockValueByCategory,
  listWeekConsumptionRows,
  type CategoryStockValue,
  type WeekConsumptionRow,
} from "@/services/inventory/statsQueries";
import { buildBillingWeekRevenue, buildPaymentMethodMix } from "@/features/admin/lib/dashboardBillingStats";
import { buildWeekConsumptionChart } from "@/features/admin/lib/dashboardInventoryStats";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function thisWeekRange(now = new Date()): { from: string; to: string } {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  const day = monday.getDay();
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { from: monday.toISOString(), to: sunday.toISOString() };
}

export default async function AdminOverviewPage({ searchParams }: PageProps) {
  const session = await requirePagePermission("dashboard.view");
  const scopeToDoctor = session.isDoctor && session.dashboardScope === "own";
  const canViewBilling = hasPermission(session, "patients.view");
  const canViewInventory = hasPermission(session, "inventory.view");
  const raw = await reservationFiltersCache.parse(searchParams);
  const filters = resolveReservationFilters(raw, defaultOverviewFromTo());
  // Even when the date filter is "Today", load through day+2 so Day Schedule
  // and upcoming lists can show tomorrow / day after without a blank next click.
  const coverage = expandCoverageThroughAfterTomorrow(filters.from, filters.to);
  const listFilters = {
    ...filters,
    from: coverage.from,
    to: coverage.to,
    // Forced server-side regardless of query params — a scoped doctor can't
    // switch back to "all doctors" by editing the URL.
    doctorId: scopeToDoctor ? session.user!.id : filters.doctorId,
    // Unassigned reservations (no doctor picked yet) stay visible to every
    // scoped doctor rather than disappearing until someone assigns one.
    includeUnassigned: scopeToDoctor,
  };

  const supabase = await createClient();
  const week = thisWeekRange();
  const [
    { data: auth },
    reservations,
    servicesRes,
    conversations,
    settingsRes,
    weekPayments,
    patientBalances,
    pendingBillingPayments,
    stockValueByCategory,
    weekConsumptionRows,
    lowStockCount,
    pendingApprovalsCount,
  ] = await Promise.all([
    supabase.auth.getUser(),
    listReservationsServer(supabase, listFilters).catch(() => []),
    supabase
      .from("services")
      .select("*")
      .is("deleted_at", null)
      .eq("is_published", true)
      .order("sort_order", { ascending: true }),
    listConversations(supabase, {
      status: "open",
      sort: "newest",
      limit: DASHBOARD_LIST_LIMIT,
    }).catch(() => []),
    supabase.from("site_settings").select("*").limit(1).maybeSingle(),
    canViewBilling
      ? listWeekPayments(supabase, week.from, week.to).catch(() => [] as WeekPaymentRow[])
      : Promise.resolve([] as WeekPaymentRow[]),
    canViewBilling
      ? listPatientBalances(supabase).catch(() => [] as PatientBalance[])
      : Promise.resolve([] as PatientBalance[]),
    canViewBilling
      ? listPendingBillingPayments(supabase).catch(() => [] as BillingPaymentQueueRow[])
      : Promise.resolve([] as BillingPaymentQueueRow[]),
    canViewInventory
      ? getStockValueByCategory(supabase).catch(() => [] as CategoryStockValue[])
      : Promise.resolve([] as CategoryStockValue[]),
    canViewInventory
      ? listWeekConsumptionRows(supabase, week.from, week.to).catch(() => [] as WeekConsumptionRow[])
      : Promise.resolve([] as WeekConsumptionRow[]),
    canViewInventory
      ? countLowStockItems(supabase).catch(() => 0)
      : Promise.resolve(0),
    canViewInventory
      ? countPendingApprovals(supabase).catch(() => 0)
      : Promise.resolve(0),
  ]);

  let doctorProduction = null;
  if (scopeToDoctor) {
    doctorProduction = await listDoctorProductionThisWeek(
      supabase,
      session.user!.id,
      week.from,
      week.to,
    ).catch(() => null);
  }

  const billingStats = canViewBilling
    ? {
        weekRevenue: buildBillingWeekRevenue(weekPayments),
        methodMix: buildPaymentMethodMix(weekPayments),
      }
    : null;
  const inventoryStats = canViewInventory
    ? {
        stockValueByCategory,
        weekConsumption: buildWeekConsumptionChart(weekConsumptionRows),
      }
    : null;

  const email = auth.user?.email ?? null;
  // Prefer the name the user set on their profile; fall back to guessing it
  // from the email's local part as before.
  const { data: profile } = auth.user
    ? await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", auth.user.id)
        .maybeSingle()
    : { data: null };
  const displayName = profile?.display_name?.trim() || firstNameFromEmail(email);
  const publishedCount = servicesRes.data?.length ?? 0;
  const stats = buildReservationStats(reservations);
  const unreadChats = conversations.reduce(
    (sum, row) => sum + (row.unread_count ?? 0),
    0,
  );
  const settings = settingsRes.data ?? null;
  const initialLayout = normalizeDashboardLayout(
    settings?.dashboard_layout ?? DEFAULT_DASHBOARD_LAYOUT,
  );
  const kpis = [
    ...buildDashboardKpis(reservations, publishedCount, unreadChats),
    ...buildBillingInventoryKpis({
      outstandingBalance: canViewBilling
        ? sumOutstandingBalance(patientBalances)
        : null,
      pendingPaymentsCount: canViewBilling ? pendingBillingPayments.length : null,
      lowStockCount: canViewInventory ? lowStockCount : null,
      pendingApprovalsCount: canViewInventory ? pendingApprovalsCount : null,
    }),
  ];

  return (
    <ClinicDashboard
      email={email}
      displayName={displayName}
      avatarUrl={profile?.avatar_url ?? null}
      reservations={reservations}
      coverageFrom={coverage.from}
      coverageTo={coverage.to}
      services={servicesRes.data ?? []}
      attention={buildAttentionItems(reservations)}
      kpis={kpis}
      stats={stats}
      conversations={conversations}
      settings={settings}
      initialLayout={initialLayout}
      scopeToDoctor={scopeToDoctor}
      doctorProduction={doctorProduction}
      canViewBilling={canViewBilling}
      canViewInventory={canViewInventory}
      billingStats={billingStats}
      inventoryStats={inventoryStats}
      canPropose={session.permissions.has("patients.treatments.edit")}
      currentDoctorId={session.isDoctor ? session.user!.id : null}
      canPickDoctor={!session.isDoctor}
    />
  );
}
