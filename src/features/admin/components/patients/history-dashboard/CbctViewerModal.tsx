"use client";

import { useCallback, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CbctSlice } from "./CbctSlice";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CbctViewerModal({ open, onOpenChange }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    dragRef.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, [offset.x, offset.y]);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!dragRef.current) return;
    setOffset({
      x: event.clientX - dragRef.current.x,
      y: event.clientY - dragRef.current.y,
    });
  }, []);

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    dragRef.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="h-[min(88vh,720px)] w-[min(96vw,960px)] max-w-none gap-3 bg-[#111111] p-0 text-white ring-white/10"
      >
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="text-white">CBCT quadrant viewer — Tooth #14</DialogTitle>
        </DialogHeader>
        <div className="flex items-center gap-2 px-4">
          <button
            type="button"
            className="rounded-full bg-white/10 px-3 py-1 text-xs"
            onClick={() => setScale((value) => Math.max(1, value - 0.25))}
          >
            Zoom out
          </button>
          <button
            type="button"
            className="rounded-full bg-white/10 px-3 py-1 text-xs"
            onClick={() => setScale((value) => Math.min(3, value + 0.25))}
          >
            Zoom in
          </button>
        </div>
        <div
          ref={viewportRef}
          className="relative mx-4 mb-4 flex-1 touch-none overflow-hidden rounded-2xl bg-black"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div
            className="grid h-full w-full grid-cols-2 gap-2 p-3 transition-transform duration-150"
            style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
          >
            {([0, 1, 2, 3] as const).map((variant) => (
              <div key={variant} className="aspect-square overflow-hidden rounded-xl">
                <CbctSlice variant={variant} />
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
