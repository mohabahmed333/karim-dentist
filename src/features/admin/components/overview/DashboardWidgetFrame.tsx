"use client";

import { useRef, type DragEvent, type ReactNode } from "react";
import {
  type DashboardColSpan,
  type DashboardDropEdge,
  type DashboardWidgetId,
  type DashboardWidgetPlacement,
} from "@/features/admin/lib/dashboardLayout";
import { DashboardDropPlaceholder } from "./DashboardDropPlaceholder";
import { DashboardWidgetChrome } from "./DashboardWidgetChrome";
import { DashboardWidgetHeightHandle } from "./DashboardWidgetHeightHandle";

type Props = {
  placement: DashboardWidgetPlacement;
  editing: boolean;
  dragOver: boolean;
  dropEdge: DashboardDropEdge | null;
  dragging: boolean;
  maxColSpan?: DashboardColSpan;
  onDragStart: (
    id: DashboardWidgetId,
    event: DragEvent<HTMLElement>,
  ) => void;
  onDragOver: (
    id: DashboardWidgetId,
    event: DragEvent<HTMLElement>,
  ) => void;
  onDrop: (
    id: DashboardWidgetId,
    event: DragEvent<HTMLElement>,
  ) => void;
  onDragEnd: () => void;
  onResize: (id: DashboardWidgetId, colSpan: DashboardColSpan) => void;
  onRemove: (id: DashboardWidgetId) => void;
  onHeightChange: (id: DashboardWidgetId, heightPx: number) => void;
  onHeightCommit: () => void;
  children: ReactNode;
};

export function DashboardWidgetFrame({
  placement,
  editing,
  dragOver,
  dropEdge,
  dragging,
  maxColSpan = 12,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onResize,
  onRemove,
  onHeightChange,
  onHeightCommit,
  children,
}: Props) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const heightPx = placement.heightPx;
  const showPlace = editing && dragOver && !dragging && dropEdge != null;
  const showAbove = showPlace && dropEdge === "above";
  const showBelow = showPlace && dropEdge === "below";
  const showLeft = showPlace && dropEdge === "left";
  const showRight = showPlace && dropEdge === "right";

  return (
    <div
      data-dash-widget-id={placement.id}
      className="flex h-full w-full min-w-0 flex-col [overflow-anchor:none]"
      onDragOver={
        editing
          ? (e) => {
              e.preventDefault();
              onDragOver(placement.id, e);
            }
          : undefined
      }
      onDrop={
        editing
          ? (e) => {
              e.preventDefault();
              onDrop(placement.id, e);
            }
          : undefined
      }
    >
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        {showAbove ? <DashboardDropPlaceholder /> : null}
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch gap-2">
          {showLeft ? (
            <DashboardDropPlaceholder className="min-w-[30%] flex-1" />
          ) : null}
          <div
            ref={bodyRef}
            data-dash-widget-body
            className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden [overflow-anchor:none] *:h-full *:min-h-0"
            style={heightPx != null ? { height: heightPx } : undefined}
          >
            <DashboardWidgetChrome
              placement={placement}
              editing={editing}
              dragging={dragging}
              maxColSpan={maxColSpan}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onResize={onResize}
              onRemove={onRemove}
            >
              {children}
            </DashboardWidgetChrome>
          </div>
          {showRight ? (
            <DashboardDropPlaceholder className="min-w-[30%] flex-1" />
          ) : null}
        </div>
        {showBelow ? <DashboardDropPlaceholder /> : null}
      </div>
      {editing ? (
        <DashboardWidgetHeightHandle
          heightPx={heightPx}
          measureRef={bodyRef}
          onHeightChange={(h) => onHeightChange(placement.id, h)}
          onHeightCommit={onHeightCommit}
        />
      ) : null}
    </div>
  );
}
