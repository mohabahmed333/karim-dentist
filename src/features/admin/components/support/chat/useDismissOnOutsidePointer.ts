"use client";

import { useEffect, useRef, type RefObject } from "react";

function isProtectedOverlay(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      [
        "[role='dialog']",
        "[data-radix-dialog-content]",
        "[data-radix-select-content]",
        "[data-radix-popper-content-wrapper]",
        "[data-radix-menu-content]",
      ].join(","),
    ),
  );
}

/** Close a popover when clicking outside its root (ignores portaled dialogs/selects). */
export function useDismissOnOutsidePointer(
  active: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onDismiss: () => void,
  extraKeepOpenRefs: RefObject<HTMLElement | null>[] = [],
) {
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;
  const keepRefs = useRef(extraKeepOpenRefs);
  keepRefs.current = extraKeepOpenRefs;

  useEffect(() => {
    if (!active) return;

    function onPointerDown(event: PointerEvent) {
      if (isProtectedOverlay(event.target)) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      for (const ref of keepRefs.current) {
        if (ref.current?.contains(target)) return;
      }
      dismissRef.current();
    }

    document.addEventListener("pointerdown", onPointerDown, true);
    return () =>
      document.removeEventListener("pointerdown", onPointerDown, true);
  }, [active, rootRef]);
}
