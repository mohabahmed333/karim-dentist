"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import type { CanvasNode, NodeSize } from "./canvas.types";
import { NodeShapeRegistry } from "./NodeShapeRegistry";

type Props = {
  node: CanvasNode;
  scale: number;
  dragging: boolean;
  selected: boolean;
  hovered: boolean;
  onBegin: (id: string) => void;
  onDrag: (id: string, offsetX: number, offsetY: number) => void;
  onEnd: () => void;
  onSize: (id: string, size: NodeSize) => void;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
  onContextMenu: (nodeId: string, x: number, y: number) => void;
  onAddChild: (nodeId: string) => void;
  onOpenCbct?: () => void;
};

export function DraggableNode({
  node,
  scale,
  dragging,
  selected,
  hovered,
  onBegin,
  onDrag,
  onEnd,
  onSize,
  onSelect,
  onHover,
  onContextMenu,
  onAddChild,
  onOpenCbct,
}: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const report = () => onSize(node.id, { width: el.offsetWidth, height: el.offsetHeight });
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [node.id, onSize]);

  return (
    <motion.div
      ref={shellRef}
      data-node-shell
      style={{ position: "absolute", left: node.x, top: node.y }}
      animate={{ scale: dragging ? 1.02 : 1 }}
      transition={{ duration: 0.12 }}
      className={`group touch-none select-none ${
        dragging || selected
          ? "z-50 ring-2 ring-[#E2F163] ring-offset-2 ring-offset-[#EBEAE5]"
          : "z-20"
      }`}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
      onContextMenu={(event) => {
        event.preventDefault();
        onContextMenu(node.id, event.clientX, event.clientY);
      }}
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("[data-add-child]")) return;
        event.stopPropagation();
        onSelect(node.id);
        onBegin(node.id);
        pointerRef.current = { x: event.clientX, y: event.clientY };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!pointerRef.current) return;
        const dx = (event.clientX - pointerRef.current.x) / scale;
        const dy = (event.clientY - pointerRef.current.y) / scale;
        onDrag(node.id, dx, dy);
      }}
      onPointerUp={(event) => {
        if (!pointerRef.current) return;
        pointerRef.current = null;
        onEnd();
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        pointerRef.current = null;
        onEnd();
        event.currentTarget.releasePointerCapture(event.pointerId);
      }}
    >
      <NodeShapeRegistry node={node} onOpenCbct={onOpenCbct} />
      {hovered && !dragging ? (
        <button
          type="button"
          data-add-child
          aria-label="Add child node"
          onClick={() => onAddChild(node.id)}
          className="absolute top-1/2 -right-3 z-10 flex size-6 -translate-y-1/2 items-center justify-center rounded-full bg-[#E2F163] text-[#111111] shadow-md"
        >
          <Plus className="size-3.5" />
        </button>
      ) : null}
    </motion.div>
  );
}
