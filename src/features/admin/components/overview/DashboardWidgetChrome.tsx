"use client";

import type { DragEvent, ReactNode } from "react";
import { GripVertical, Trash2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import {
  widgetMeta,
  type DashboardColSpan,
  type DashboardWidgetId,
  type DashboardWidgetPlacement,
} from "@/features/admin/lib/dashboardLayout";
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

  if (!editing) {
    return (
      <div className="flex h-full min-h-0 flex-col *:h-full *:min-h-0">
        {children}
      </div>
    );
  }

  return (
    <div
      role="listitem"
      aria-label={t(meta.labelKey)}
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden rounded-md ring-1 ring-[var(--admin-border)]",
        dragging && "opacity-30",
      )}
    >
      <div
        data-no-widget-drag
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
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <div
          draggable
          data-dash-widget-drag-surface
          aria-hidden
          className={cn(
            "absolute inset-0 z-10",
            dragging ? "cursor-grabbing" : "cursor-grab",
          )}
          style={{ WebkitUserDrag: "element" }}
          onDragStart={(e) => onDragStart(placement.id, e)}
          onDragEnd={onDragEnd}
        />
        <div className="pointer-events-none relative z-0 flex min-h-0 flex-1 flex-col opacity-90 *:h-full *:min-h-0">
          {children}
        </div>
      </div>
    </div>
  );
}
