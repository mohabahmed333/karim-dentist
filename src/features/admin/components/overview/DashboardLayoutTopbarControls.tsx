"use client";

import {
  LayoutGrid,
  Plus,
  Redo2,
  RotateCcw,
  Save,
  Undo2,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "@/lib/i18n";
import {
  DASHBOARD_LAYOUT_STATE_EVENT,
  INACTIVE_DASHBOARD_LAYOUT_STATE,
  dispatchDashboardLayoutAction,
  type DashboardLayoutUiState,
} from "@/features/admin/lib/dashboardLayoutBridge";
import {
  dashboardEditChromeTransition,
  dashboardEditChromeVariants,
} from "@/features/admin/lib/dashboardLayoutMotion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { DashboardWidgetCatalog } from "./DashboardWidgetCatalog";

function TipButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        delay={200}
        closeDelay={0}
        render={
          <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            aria-label={label}
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md text-[var(--admin-muted)]",
              "hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]",
              "disabled:pointer-events-none disabled:opacity-40",
              active && "bg-[var(--admin-hover)] text-[var(--admin-text)]",
            )}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function DashboardLayoutTopbarControls() {
  const t = useTranslations();
  const reduced = useReducedMotion();
  const transition = dashboardEditChromeTransition(reduced);
  const variants = dashboardEditChromeVariants(reduced);
  const [state, setState] = useState(INACTIVE_DASHBOARD_LAYOUT_STATE);

  useEffect(() => {
    function onState(event: Event) {
      const detail = (event as CustomEvent<DashboardLayoutUiState>).detail;
      if (detail) setState(detail);
    }
    window.addEventListener(DASHBOARD_LAYOUT_STATE_EVENT, onState);
    return () => {
      window.removeEventListener(DASHBOARD_LAYOUT_STATE_EVENT, onState);
      setState(INACTIVE_DASHBOARD_LAYOUT_STATE);
    };
  }, []);

  if (!state.active) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {!state.editing ? (
            <motion.div
              key="idle"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
            >
              <TipButton
                label={t("admin.overview.customize.edit")}
                onClick={() =>
                  dispatchDashboardLayoutAction({ type: "toggleEdit" })
                }
              >
                <LayoutGrid className="size-4" aria-hidden />
              </TipButton>
            </motion.div>
          ) : (
            <motion.div
              key="editing"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={transition}
              className="flex items-center gap-0.5"
            >
              <TipButton
                label={t("admin.overview.customize.undo")}
                disabled={!state.canUndo}
                onClick={() =>
                  dispatchDashboardLayoutAction({ type: "undo" })
                }
              >
                <Undo2 className="size-4" aria-hidden />
              </TipButton>
              <TipButton
                label={t("admin.overview.customize.redo")}
                disabled={!state.canRedo}
                onClick={() =>
                  dispatchDashboardLayoutAction({ type: "redo" })
                }
              >
                <Redo2 className="size-4" aria-hidden />
              </TipButton>
              <div className="relative">
                <TipButton
                  label={t("admin.overview.customize.add")}
                  active={state.catalogOpen}
                  onClick={() =>
                    dispatchDashboardLayoutAction({ type: "toggleCatalog" })
                  }
                >
                  <Plus className="size-4" aria-hidden />
                </TipButton>
                {state.catalogOpen ? (
                  <DashboardWidgetCatalog
                    missing={state.missing}
                    onAdd={(id) =>
                      dispatchDashboardLayoutAction({ type: "add", id })
                    }
                    onClose={() =>
                      dispatchDashboardLayoutAction({ type: "closeCatalog" })
                    }
                  />
                ) : null}
              </div>
              <TipButton
                label={t("admin.overview.customize.reset")}
                onClick={() =>
                  dispatchDashboardLayoutAction({ type: "reset" })
                }
              >
                <RotateCcw className="size-4" aria-hidden />
              </TipButton>
              <TipButton
                label={
                  state.saving
                    ? t("admin.overview.customize.saving")
                    : t("admin.overview.customize.save")
                }
                disabled={state.saving || !state.dirty}
                onClick={() =>
                  dispatchDashboardLayoutAction({ type: "save" })
                }
              >
                <Save className="size-4" aria-hidden />
              </TipButton>
              <TipButton
                label={t("admin.cancel")}
                onClick={() =>
                  dispatchDashboardLayoutAction({ type: "cancelEdit" })
                }
              >
                <X className="size-4" aria-hidden />
              </TipButton>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
