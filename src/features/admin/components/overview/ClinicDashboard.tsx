"use client";

import { useState } from "react";
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

type Props = {
  email: string | null;
  displayName: string;
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
};

export function ClinicDashboard({
  email,
  displayName,
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
}: Props) {
  const [clinicReservation, setClinicReservation] =
    useState<Reservation | null>(null);
  const [filtering, setFiltering] = useState(false);
  const t = useTranslations();
  const reduced = useReducedMotion();
  const layoutTransition = dashboardLayoutTransition(reduced);
  const chromeTransition = dashboardEditChromeTransition(reduced);
  const slotVariants = dashboardEditSlotVariants(reduced);
  const editor = useDashboardLayoutEditor(settings, initialLayout);
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
  };

  return (
    <>
      <AdminPageMotion className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <DashboardGreeting
            email={email}
            displayName={displayName}
            reservations={reservations}
          />
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
      />
    </>
  );
}
