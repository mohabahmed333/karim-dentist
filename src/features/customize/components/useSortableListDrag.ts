"use client";

import { useEffect, useRef, useState } from "react";
import {
  captureDragGhost,
  setTransparentDragImage,
  type SortableDragGhostState,
} from "./SortableDragGhost";

export function useSortableListDrag(
  onReorder: (fromIndex: number, toIndex: number) => void,
  disabled = false,
) {
  const fromIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragGhost, setDragGhost] = useState<SortableDragGhostState | null>(
    null,
  );

  const endDrag = () => {
    fromIndex.current = null;
    setOverIndex(null);
    setDraggingIndex(null);
    setDragGhost(null);
  };

  useEffect(() => {
    if (draggingIndex === null) return;

    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      setDragGhost((current) =>
        current
          ? { ...current, x: event.clientX, y: event.clientY }
          : current,
      );
    };

    const onDragEnd = () => endDrag();

    document.addEventListener("dragover", onDragOver);
    document.addEventListener("dragend", onDragEnd);
    window.addEventListener("blur", onDragEnd);
    return () => {
      document.removeEventListener("dragover", onDragOver);
      document.removeEventListener("dragend", onDragEnd);
      window.removeEventListener("blur", onDragEnd);
    };
  }, [draggingIndex]);

  const getHandleProps = (index: number) => ({
    draggable: !disabled,
    onDragStart: (event: React.DragEvent<Element>) => {
      fromIndex.current = index;
      setDraggingIndex(index);
      event.dataTransfer.effectAllowed = "move";
      setDragGhost(captureDragGhost(event));
      setTransparentDragImage(event);
      event.stopPropagation();
    },
    onDragEnd: endDrag,
  });

  const getItemProps = (index: number) => ({
    onDragOver: (event: React.DragEvent) => {
      if (disabled || fromIndex.current === null) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      if (fromIndex.current !== index) setOverIndex(index);
    },
    onDrop: (event: React.DragEvent) => {
      event.preventDefault();
      const from = fromIndex.current;
      if (from !== null && from !== index) onReorder(from, index);
      endDrag();
    },
    onDragLeave: (event: React.DragEvent) => {
      if (disabled || fromIndex.current === null) return;
      const next = event.relatedTarget as Node | null;
      if (next && event.currentTarget.contains(next)) return;
      setOverIndex((current) => (current === index ? null : current));
    },
  });

  return { getHandleProps, getItemProps, overIndex, draggingIndex, dragGhost };
}
