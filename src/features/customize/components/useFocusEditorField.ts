"use client";

import { useEffect, useRef } from "react";

export function useFocusEditorField(
  focusField: string | null | undefined,
  itemId: string,
) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!focusField || !rootRef.current) return;
    const el = rootRef.current.querySelector<HTMLElement>(
      `[data-editor-field="${CSS.escape(focusField)}"]`,
    );
    if (!el) return;

    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: "auto", block: "nearest" });
      el.classList.add("is-field-focused");
      const input = el.querySelector<HTMLElement>("input, textarea, button");
      input?.focus({ preventScroll: true });
    });

    const timer = window.setTimeout(() => {
      el.classList.remove("is-field-focused");
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [focusField, itemId]);

  return rootRef;
}
