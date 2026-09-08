"use client";

import type { PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  INBOX_WIDTH_DEFAULT,
  nextInboxWidthFromDrag,
  readStoredInboxWidth,
  writeStoredInboxWidth,
} from "./inboxColumnWidth";

export function useInboxColumnWidth(rtl = false) {
  const [width, setWidth] = useState(INBOX_WIDTH_DEFAULT);
  const [hydrated, setHydrated] = useState(false);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);
  const startWidth = useRef(width);
  const rtlRef = useRef(rtl);
  rtlRef.current = rtl;

  useEffect(() => {
    setWidth(readStoredInboxWidth());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStoredInboxWidth(width);
  }, [hydrated, width]);

  const onPointerMove = useCallback((event: PointerEvent) => {
    setWidth(
      nextInboxWidthFromDrag(
        startWidth.current,
        startX.current,
        event.clientX,
        rtlRef.current,
      ),
    );
  }, []);

  const stopResize = useCallback(() => {
    setDragging(false);
    document.body.style.removeProperty("cursor");
    document.body.style.removeProperty("user-select");
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", stopResize);
    window.removeEventListener("pointercancel", stopResize);
  }, [onPointerMove]);

  const startResize = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      startX.current = event.clientX;
      startWidth.current = width;
      setDragging(true);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", stopResize);
      window.addEventListener("pointercancel", stopResize);
    },
    [onPointerMove, stopResize, width],
  );

  useEffect(() => () => stopResize(), [stopResize]);

  return { width, dragging, startResize };
}
