"use client";

import { useEffect, useRef } from "react";
import { parseSectionBlockIdFromField } from "../lib/sectionField";
import { SECTION_DOM_IDS } from "../sectionRegistry";
import type { CustomizeSection } from "../types";

const SECTION_FRAME_INSET: Partial<Record<CustomizeSection, number>> = {
  "case-studies": 8,
};

const SECTION_FRAME_NUDGE: Partial<Record<CustomizeSection, number>> = {
  "case-studies": 72,
};

function scrollPreviewToTop(root: HTMLElement) {
  root.scrollTo({ top: 0, left: 0, behavior: "auto" });
  root.closest<HTMLElement>(".customize-device-frame")?.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
  root.closest<HTMLElement>("[data-customize-preview-scroll]")?.scrollTo({
    top: 0,
    left: 0,
    behavior: "auto",
  });
}

function scrollToSelector(root: HTMLElement, selector: string) {
  root.querySelector(selector)?.scrollIntoView({
    behavior: "auto",
    block: "nearest",
  });
}

/** Scroll only the device-frame preview — avoids jumping the editor sidebar. */
function scrollDeviceFrameToSection(
  root: HTMLElement,
  sectionId: string,
  section?: CustomizeSection,
) {
  const frame = root.closest<HTMLElement>(".customize-device-frame");
  const target = root.querySelector<HTMLElement>(`#${CSS.escape(sectionId)}`);
  if (!frame || !target) return;

  const inset = section ? (SECTION_FRAME_INSET[section] ?? 20) : 20;
  const nudge = section ? (SECTION_FRAME_NUDGE[section] ?? 0) : 0;
  const frameTop = frame.getBoundingClientRect().top;
  const targetTop = target.getBoundingClientRect().top;
  const nextTop = frame.scrollTop + (targetTop - frameTop) - inset + nudge;

  frame.scrollTo({ top: Math.max(0, nextTop), left: 0, behavior: "auto" });
}

export function usePreviewScroll(
  section: CustomizeSection,
  itemId: string | null,
  builderMode?: boolean,
  focusField?: string | null,
  indexPreview?: boolean,
  freezeScroll?: boolean,
  sectionScrollOnly?: boolean,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const lastScrollKey = useRef<string | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.querySelectorAll<HTMLElement>("[data-customize-item]").forEach((el) => {
      if (el.tabIndex < 0) el.tabIndex = 0;
      if (!el.getAttribute("role")) el.setAttribute("role", "button");
    });

    root
      .querySelectorAll<HTMLElement>("[data-customize-section]")
      .forEach((el) => {
        if (!el.hasAttribute("tabindex")) el.tabIndex = 0;
      });
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    root.dataset.activeSection = section;
    root.dataset.activeItem = itemId ?? "";
    root.dataset.builderMode = builderMode ? "true" : "false";

    root.querySelectorAll<HTMLElement>("[data-customize-section-block]").forEach(
      (el) => {
        const blockId = el.getAttribute("data-customize-section-block");
        const active =
          Boolean(builderMode) &&
          blockId === parseSectionBlockIdFromField(focusField);
        el.classList.toggle("is-customize-active", active);
      },
    );

    root.querySelectorAll<HTMLElement>("[data-customize-item]").forEach((el) => {
      const active =
        Boolean(itemId) && el.getAttribute("data-customize-item") === itemId;
      el.classList.toggle("is-customize-active", active);
    });

    const scrollKey = `${section}:${itemId ?? ""}:${builderMode ? "builder" : "home"}:${indexPreview ? "index" : "home"}:${focusField ?? ""}`;
    if (lastScrollKey.current === scrollKey) return;
    lastScrollKey.current = scrollKey;

    if (freezeScroll) {
      requestAnimationFrame(() => scrollPreviewToTop(root));
      return;
    }

    if (sectionScrollOnly) {
      const scrollToActiveSection = () => {
        const id = SECTION_DOM_IDS[section];
        if (id) scrollDeviceFrameToSection(root, id, section);
        else scrollPreviewToTop(root);
      };

      requestAnimationFrame(() => {
        requestAnimationFrame(scrollToActiveSection);
      });
      const retryA = window.setTimeout(scrollToActiveSection, 140);
      const retryB = window.setTimeout(scrollToActiveSection, 360);

      return () => {
        window.clearTimeout(retryA);
        window.clearTimeout(retryB);
      };
    }

    requestAnimationFrame(() => {
      const sectionBlockId = parseSectionBlockIdFromField(focusField);

      if (builderMode && sectionBlockId) {
        scrollToSelector(
          root,
          `#${CSS.escape(`customize-section-${sectionBlockId}`)}`,
        );
        return;
      }

      if (builderMode) {
        scrollPreviewToTop(root);
        return;
      }

      if (itemId) {
        scrollToSelector(root, `#${CSS.escape(`customize-item-${itemId}`)}`);
        return;
      }

      if (indexPreview) {
        scrollPreviewToTop(root);
        return;
      }

      const id = SECTION_DOM_IDS[section];
      if (id) {
        scrollToSelector(root, `#${CSS.escape(id)}`);
        return;
      }

      scrollPreviewToTop(root);
    });
  }, [section, itemId, builderMode, focusField, indexPreview, freezeScroll, sectionScrollOnly]);

  return rootRef;
}
