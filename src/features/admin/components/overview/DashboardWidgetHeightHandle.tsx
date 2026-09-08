"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useTranslations } from "@/lib/i18n";
import {
  DASHBOARD_WIDGET_HEIGHT_MIN,
  nextDashboardWidgetHeightFromDrag,
  viewportWidgetHeightMax,
} from "@/features/admin/lib/dashboardWidgetHeight";
import { findVerticalScrollParent } from "@/features/admin/lib/dashboardDragScroll";
import { cn } from "@/lib/utils";

type Props = {
  heightPx: number | undefined;
  measureRef: RefObject<HTMLElement | null>;
  onHeightChange: (heightPx: number) => void;
  onHeightCommit: () => void;
};

export function DashboardWidgetHeightHandle({
  heightPx,
  measureRef,
  onHeightChange,
  onHeightCommit,
}: Props) {
  const t = useTranslations();
  const [dragging, setDragging] = useState(false);
  const [dragMax, setDragMax] = useState(viewportWidgetHeightMax);
  const startY = useRef(0);
  const startHeight = useRef(0);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const scrollTopRef = useRef(0);

  useEffect(() => {
    function syncMax() {
      setDragMax(viewportWidgetHeightMax());
    }
    syncMax();
    window.addEventListener("resize", syncMax);
    return () => window.removeEventListener("resize", syncMax);
  }, []);

  // After React applies the new height, pin scroll so the page doesn't jump.
  useLayoutEffect(() => {
    if (!dragging) return;
    const scroller = scrollParentRef.current;
    if (scroller) scroller.scrollTop = scrollTopRef.current;
  });

  useEffect(() => {
    if (!dragging) return;
    function onPointerMove(event: PointerEvent) {
      onHeightChange(
        nextDashboardWidgetHeightFromDrag(
          startHeight.current,
          startY.current,
          event.clientY,
          dragMax,
        ),
      );
      const scroller = scrollParentRef.current;
      if (scroller) scroller.scrollTop = scrollTopRef.current;
    }
    function finishResize() {
      setDragging(false);
      onHeightCommit();
    }
    document.body.style.cursor = "row-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", finishResize);
    window.addEventListener("pointercancel", finishResize);
    return () => {
      document.body.style.removeProperty("cursor");
      document.body.style.removeProperty("user-select");
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", finishResize);
      window.removeEventListener("pointercancel", finishResize);
    };
  }, [dragMax, dragging, onHeightChange, onHeightCommit]);

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const max = viewportWidgetHeightMax();
      setDragMax(max);
      const measured =
        heightPx ??
        measureRef.current?.getBoundingClientRect().height ??
        DASHBOARD_WIDGET_HEIGHT_MIN;
      startY.current = event.clientY;
      startHeight.current = measured;
      const scroller = findVerticalScrollParent(event.currentTarget);
      scrollParentRef.current = scroller;
      scrollTopRef.current = scroller?.scrollTop ?? 0;
      setDragging(true);
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [heightPx, measureRef],
  );

  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-valuemin={DASHBOARD_WIDGET_HEIGHT_MIN}
      aria-valuemax={dragMax}
      aria-valuenow={heightPx ?? DASHBOARD_WIDGET_HEIGHT_MIN}
      aria-label={t("admin.overview.customize.resizeHeight")}
      data-no-widget-drag
      onPointerDown={startResize}
      className={cn(
        "group relative z-10 flex h-2 shrink-0 cursor-row-resize touch-none select-none items-center justify-center",
        "border-t border-transparent hover:border-[var(--admin-border)] hover:bg-[var(--admin-hover)]",
        dragging && "border-[var(--admin-border)] bg-[var(--admin-hover)]",
        "[overflow-anchor:none]",
      )}
    >
      <span
        className={cn(
          "h-0.5 w-8 rounded-full bg-[var(--admin-border)] opacity-0",
          "group-hover:opacity-100",
          dragging && "bg-[var(--admin-muted)] opacity-100",
        )}
      />
    </div>
  );
}
