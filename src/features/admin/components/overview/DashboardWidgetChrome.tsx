"use client";

import type { CSSProperties, DragEvent, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { GripVertical, Trash2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import {
  widgetMeta,
  type DashboardColSpan,
  type DashboardWidgetId,
  type DashboardWidgetPlacement,
} from "@/features/admin/lib/dashboardLayout";
import {
  dashboardEditChromeTransition,
  dashboardEditChromeVariants,
} from "@/features/admin/lib/dashboardLayoutMotion";
import { cn } from "@/lib/utils";

type Props = {
  placement: DashboardWidgetPlacement;
  editing: boolean;
  dragging: boolean;
  maxColSpan: DashboardColSpan;
  onDragStart: (
    id: DashboardWidgetId,
    event: DragEvent<HTMLElement>,
  ) => void;
  onDragEnd: () => void;
  onResize: (id: DashboardWidgetId, colSpan: DashboardColSpan) => void;
  onRemove: (id: DashboardWidgetId) => void;
  children: ReactNode;
};

const SIZE_CHIPS: { span: DashboardColSpan; label: string }[] = [
  { span: 3, label: "3" },
  { span: 4, label: "4" },
  { span: 6, label: "6" },
  { span: 8, label: "8" },
  { span: 9, label: "9" },
  { span: 12, label: "12" },
];

export function DashboardWidgetChrome({
  placement,
  editing,
  dragging,
  maxColSpan,
  onDragStart,
  onDragEnd,
  onResize,
  onRemove,
  children,
}: Props) {
  const t = useTranslations();
  const meta = widgetMeta(placement.id);
  const reduced = useReducedMotion();
  const transition = dashboardEditChromeTransition(reduced);
  const variants = dashboardEditChromeVariants(reduced);

  return (
    <div
      role={editing ? "listitem" : undefined}
      aria-label={editing ? t(meta.labelKey) : undefined}
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-md",
        editing && "ring-1 ring-[var(--admin-border)]",
        dragging && "opacity-30",
      )}
    >
      <AnimatePresence initial={false}>
        {editing ? (
          <motion.div
            key="toolbar"
            data-no-widget-drag
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
            className="relative z-20 flex shrink-0 items-center gap-1 border-b border-[var(--admin-border)] bg-[var(--admin-panel)]/95 px-2 py-1 backdrop-blur-sm"
          >
            <span className="rounded p-1 text-[var(--admin-muted)]" aria-hidden>
              <GripVertical className="size-4" />
            </span>
            <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[var(--admin-text)]">
              {t(meta.labelKey)}
            </span>
            <div
              role="group"
              aria-label={t("admin.overview.customize.size")}
              title={t("admin.overview.customize.sizeHint")}
              className="flex shrink-0 overflow-hidden rounded border border-[var(--admin-border)]"
            >
              {SIZE_CHIPS.filter((chip) =>
                meta.allowedColSpans.includes(chip.span),
              ).map((chip) => {
                const tooWide = chip.span > maxColSpan;
                return (
                  <button
                    key={chip.span}
                    type="button"
                    disabled={tooWide}
                    className={cn(
                      "min-w-7 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      tooWide
                        ? "cursor-not-allowed bg-[var(--admin-panel)] text-[var(--admin-muted)] opacity-40"
                        : "cursor-pointer",
                      !tooWide &&
                        (placement.colSpan === chip.span
                          ? "bg-[var(--admin-primary)] text-white"
                          : "bg-[var(--admin-panel)] text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-[var(--admin-text)]"),
                    )}
                    onClick={() => onResize(placement.id, chip.span)}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              aria-label={t("admin.overview.customize.remove")}
              className="cursor-pointer rounded p-1 text-[var(--admin-muted)] hover:bg-[var(--admin-hover)] hover:text-red-600"
              onClick={() => onRemove(placement.id)}
            >
              <Trash2 className="size-3.5" />
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {editing ? (
          <div
            draggable
            data-dash-widget-drag-surface
            aria-hidden
            className={cn(
              "absolute inset-0 z-10",
              dragging ? "cursor-grabbing" : "cursor-grab",
            )}
            style={{ WebkitUserDrag: "element" } as CSSProperties}
            onDragStart={(e) => onDragStart(placement.id, e)}
            onDragEnd={onDragEnd}
          />
        ) : null}
        <div
          className={cn(
            "relative z-0 flex min-h-0 flex-1 flex-col *:h-full *:min-h-0",
            editing && "pointer-events-none opacity-90",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
