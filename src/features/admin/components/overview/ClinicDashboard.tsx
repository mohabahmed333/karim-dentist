"use client";

import { useMemo, useState } from "react";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import type { Reservation } from "@/services/reservations/types";
import type { ReservationStats } from "@/services/reservations/stats";
import type {
  AttentionItem,
  DashboardKpi,
} from "@/features/admin/lib/dashboardModel";
import type { Service } from "@/services/services/types";
import type { WhatsappConversation } from "@/services/whatsapp/types";
import type { SiteSettings } from "@/services/site_settings/types";
import type { DoctorProduction } from "@/services/patient_treatments/queries";
import type {
  BillingChartStats,
  InventoryChartStats,
} from "./renderDashboardWidget";
import { AdminReservationFilters } from "@/features/admin/components/AdminReservationFilters";
import { AdminPageMotion } from "@/features/admin/components/AdminPageMotion";
import { useDashboardLayoutEditor } from "@/features/admin/hooks/useDashboardLayoutEditor";
import {
  colSpanClass,
  groupDashboardStacks,
  maxDashboardStackColSpan,
  packDashboardStackRows,
  rowGapColSpan,
  type DashboardLayout,
  type DashboardWidgetId,
} from "@/features/admin/lib/dashboardLayout";
import {
  dashboardEditChromeTransition,
  dashboardEditSlotVariants,
  dashboardLayoutTransition,
} from "@/features/admin/lib/dashboardLayoutMotion";
import { useTranslations } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { DashboardGreeting } from "./DashboardGreeting";
import { DashboardPageSkeleton } from "./DashboardPageSkeleton";
import { HomePatientClinicDrawer } from "./HomePatientClinicDrawer";
import { DashboardDropPlaceholder } from "./DashboardDropPlaceholder";
import { DashboardWidgetFrame } from "./DashboardWidgetFrame";
import { DashboardWidgetHost } from "./DashboardWidgetHost";
import type { AdminDemoClinical } from "@/features/admin/lib/adminDemoClinical";

type Props = {
  email: string | null;
  displayName: string;
  /** Profile photo, when the user has set one. */
  avatarUrl?: string | null;
  reservations: Reservation[];
  coverageFrom: string;
  coverageTo: string;
  services: Service[];
  attention: AttentionItem[];
  kpis: DashboardKpi[];
  stats: ReservationStats;
  conversations: WhatsappConversation[];
  settings: SiteSettings | null;
  initialLayout: DashboardLayout;
  /** Showreel/offline: fixture inbox rows + skip clinical fetches. */
  demoMode?: boolean;
  /** Showreel: clinical imaging/notes for Day Schedule drawer. */
  demoClinical?: AdminDemoClinical | null;
  /** True when the signed-in doctor's role has dashboard_scope "own" — reservations are already filtered to just them. */
  scopeToDoctor?: boolean;
  doctorProduction?: DoctorProduction | null;
  /** Gates the 4 billing widgets — fails closed (defaults to hidden). */
  canViewBilling?: boolean;
  /** Gates the 4 inventory widgets — fails closed (defaults to hidden). */
  canViewInventory?: boolean;
  billingStats?: BillingChartStats | null;
  inventoryStats?: InventoryChartStats | null;
  /** Billing a patient straight from their appointment. Fails closed. */
  canPropose?: boolean;
  /** The signed-in doctor, so billing doesn't ask them who they are. */
  currentDoctorId?: string | null;
  canPickDoctor?: boolean;
};

export function ClinicDashboard({
  email,
  displayName,
  avatarUrl = null,
  reservations,
  coverageFrom,
  coverageTo,
  services,
  attention,
  kpis,
  stats,
  conversations,
  settings,
  initialLayout,
  demoMode = false,
  demoClinical = null,
  scopeToDoctor = false,
  doctorProduction = null,
  canViewBilling = false,
  canViewInventory = false,
  billingStats = null,
  inventoryStats = null,
  canPropose = false,
  currentDoctorId = null,
  canPickDoctor = true,
}: Props) {
  const [clinicReservation, setClinicReservation] =
    useState<Reservation | null>(null);
  const [filtering, setFiltering] = useState(false);
  const t = useTranslations();
  const reduced = useReducedMotion();
  const layoutTransition = dashboardLayoutTransition(reduced);
  const chromeTransition = dashboardEditChromeTransition(reduced);
  const slotVariants = dashboardEditSlotVariants(reduced);
  const hiddenWidgetIds = useMemo<DashboardWidgetId[]>(() => {
    const hidden: DashboardWidgetId[] = [];
    if (!canViewBilling) {
      hidden.push(
        "chartBillingRevenue",
        "chartBillingMethodMix",
        "kpiOutstandingBalance",
        "kpiPendingPayments",
      );
    }
    if (!canViewInventory) {
      hidden.push(
        "chartInventoryStockValue",
        "chartInventoryConsumption",
        "kpiLowStock",
        "kpiPendingApprovals",
      );
    }
    return hidden;
  }, [canViewBilling, canViewInventory]);
  const visibleInitialLayout = useMemo(
    () => initialLayout.filter((w) => !hiddenWidgetIds.includes(w.id)),
    [initialLayout, hiddenWidgetIds],
  );
  const editor = useDashboardLayoutEditor(
    settings,
    visibleInitialLayout,
    hiddenWidgetIds,
  );
  const stacks = groupDashboardStacks(editor.layout);
  const stackRows = packDashboardStackRows(stacks);
  const layoutActive = !reduced && !editor.dragFromId;

  const hostProps = {
    reservations,
    coverageFrom,
    coverageTo,
    services,
    attention,
    kpis,
    stats,
    conversations,
    onPatientSelect: setClinicReservation,
    conversationsLive: !demoMode,
    doctorProduction,
    billingStats,
    inventoryStats,
  };

  return (
    <>
      <AdminPageMotion className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <DashboardGreeting
              email={email}
              displayName={displayName}
              avatarUrl={avatarUrl}
              reservations={reservations}
            />
            {scopeToDoctor ? (
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-panel)] px-2.5 py-1 text-[11px] font-medium text-[var(--admin-muted)]">
                {t("admin.overview.scopedToOwn")}
              </span>
            ) : null}
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <AdminReservationFilters
              services={services}
              showCompare
              onPendingChange={setFiltering}
            />
          </div>
        </div>

        {filtering ? (
          <DashboardPageSkeleton />
        ) : (
          <LayoutGroup id="dashboard-layout">
            <div className="space-y-3">
              {stackRows.map((row) => {
                const gapSpan = rowGapColSpan(row.gap);
                return (
                  <div
                    key={
                      row.stacks.map((s) => s.id).join("|") ||
                      `row-${row.afterStackId ?? "end"}`
                    }
                    className="grid grid-cols-12 items-stretch gap-3"
                  >
                    {row.stacks.map((stack) => (
                      <motion.div
                        key={stack.id}
                        layout={layoutActive}
                        transition={layoutTransition}
                        className={cn(
                          colSpanClass(stack.colSpan),
                          "flex min-h-0 min-w-0 flex-col",
                        )}
                      >
                        <div className="flex min-h-0 flex-1 flex-col gap-3">
                          {stack.widgets.map((placement) => (
                            <DashboardWidgetFrame
                              key={placement.id}
                              placement={placement}
                              editing={editor.editing}
                              dragOver={editor.dragOverId === placement.id}
                              dropEdge={
                                editor.dragOverId === placement.id
                                  ? editor.dropEdge
                                  : null
                              }
                              dragging={editor.dragFromId === placement.id}
                              maxColSpan={maxDashboardStackColSpan(
                                editor.layout,
                                placement.id,
                              )}
                              onDragStart={editor.onDragStart}
                              onDragOver={editor.onDragOver}
                              onDrop={editor.onDrop}
                              onDragEnd={editor.onDragEnd}
                              onResize={editor.resize}
                              onRemove={editor.remove}
                              onHeightChange={editor.resizeHeight}
                              onHeightCommit={editor.commitHeight}
                            >
                              <DashboardWidgetHost
                                id={placement.id}
                                {...hostProps}
                              />
                            </DashboardWidgetFrame>
                          ))}
                          <AnimatePresence initial={false}>
                            {editor.editing ? (
                              <motion.div
                                key={`slot-${stack.id}`}
                                variants={slotVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={chromeTransition}
                              >
                                {editor.dragOverStackId === stack.id &&
                                editor.dragFromId ? (
                                  <div
                                    data-dash-stack-slot={stack.id}
                                    className="min-h-16"
                                    onDragOver={(e) =>
                                      editor.onStackDragOver(stack.id, e)
                                    }
                                    onDrop={(e) =>
                                      editor.onStackDrop(stack.id, e)
                                    }
                                  >
                                    <DashboardDropPlaceholder />
                                  </div>
                                ) : (
                                  <div
                                    data-dash-stack-slot={stack.id}
                                    className="min-h-10 shrink-0 rounded-md border border-dashed border-[color:color-mix(in_oklab,var(--admin-ink)_18%,transparent)] bg-[color:color-mix(in_oklab,var(--admin-ink)_4%,transparent)]"
                                    onDragOver={(e) =>
                                      editor.onStackDragOver(stack.id, e)
                                    }
                                    onDrop={(e) =>
                                      editor.onStackDrop(stack.id, e)
                                    }
                                  />
                                )}
                              </motion.div>
                            ) : null}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ))}
                    <AnimatePresence initial={false}>
                      {editor.editing && gapSpan && row.afterStackId ? (
                        <motion.div
                          key={`gap-${row.afterStackId}`}
                          layout={layoutActive}
                          variants={slotVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          transition={chromeTransition}
                          data-dash-row-gap={row.afterStackId}
                          className={cn(colSpanClass(gapSpan), "min-h-[6rem]")}
                          onDragOver={(e) =>
                            editor.onGapDragOver(row.afterStackId!, gapSpan, e)
                          }
                          onDrop={(e) =>
                            editor.onGapDrop(row.afterStackId!, gapSpan, e)
                          }
                        >
                          {editor.dragOverGapId === row.afterStackId &&
                          editor.dragFromId ? (
                            <DashboardDropPlaceholder className="h-full min-h-[6rem]" />
                          ) : (
                            <div className="h-full min-h-[6rem] rounded-md border border-dashed border-[color:color-mix(in_oklab,var(--admin-ink)_18%,transparent)] bg-[color:color-mix(in_oklab,var(--admin-ink)_4%,transparent)]" />
                          )}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                );
              })}
              <AnimatePresence initial={false}>
                {editor.editing ? (
                  <motion.div
                    key="end-slot"
                    variants={slotVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={chromeTransition}
                    data-dash-end-slot
                    className="min-h-14"
                    onDragOver={editor.onEndDragOver}
                    onDrop={editor.onEndDrop}
                  >
                    {editor.dragOverEnd && editor.dragFromId ? (
                      <DashboardDropPlaceholder className="min-h-14" />
                    ) : (
                      <div
                        className={cn(
                          "flex min-h-14 items-center justify-center rounded-md border border-dashed text-xs",
                          "border-[color:color-mix(in_oklab,var(--admin-ink)_18%,transparent)] text-[color:color-mix(in_oklab,var(--admin-ink)_45%,transparent)]",
                        )}
                      >
                        {t("admin.overview.customize.dropNewRow")}
                      </div>
                    )}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </LayoutGroup>
        )}
      </AdminPageMotion>

      <HomePatientClinicDrawer
        open={clinicReservation !== null}
        reservation={clinicReservation}
        reservations={reservations}
        onClose={() => setClinicReservation(null)}
        skipRemoteLoad={demoMode}
        demoClinical={demoMode ? demoClinical : null}
        canPropose={canPropose}
        currentDoctorId={currentDoctorId}
        canPickDoctor={canPickDoctor}
      />
    </>
  );
}
