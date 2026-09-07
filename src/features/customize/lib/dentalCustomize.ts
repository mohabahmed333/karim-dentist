"use client";

import { useEffect, useRef } from "react";
import type { PortfolioData } from "@/services/portfolio";

export function isSolutionPanelId(
  data: PortfolioData,
  id: string | null | undefined,
): boolean {
  if (!id) return false;
  return data.solutionPanels.some((panel) => panel.id === id);
}

export function isGalleryItemId(
  data: PortfolioData,
  id: string | null | undefined,
): boolean {
  if (!id) return false;
  return data.galleryItems.some((item) => item.id === id);
}

export function isGalleryComparisonId(
  data: PortfolioData,
  id: string | null | undefined,
): boolean {
  if (!id) return false;
  return data.galleryComparisons.some((item) => item.id === id);
}

export function isTrustItemId(
  data: PortfolioData,
  id: string | null | undefined,
): boolean {
  if (!id) return false;
  return data.trustItems.some((item) => item.id === id);
}

export function useFocusEditorItem(
  itemId: string | null | undefined,
  field?: string | null,
) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!itemId || !rootRef.current) return;
    const itemEl = rootRef.current.querySelector<HTMLElement>(
      `[data-editor-item="${CSS.escape(itemId)}"]`,
    );
    if (!itemEl) return;

    requestAnimationFrame(() => {
      itemEl.scrollIntoView({ behavior: "auto", block: "nearest" });
      itemEl.classList.add("is-field-focused");
      const fieldEl = field
        ? itemEl.querySelector<HTMLElement>(
            `[data-editor-field="${CSS.escape(field)}"]`,
          )
        : null;
      const input = (fieldEl ?? itemEl).querySelector<HTMLElement>(
        "input, textarea, button",
      );
      input?.focus({ preventScroll: true });
    });

    const timer = window.setTimeout(() => {
      itemEl.classList.remove("is-field-focused");
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [itemId, field]);

  return rootRef;
}
