"use client";

import { memo, useCallback } from "react";
import type { CustomizeSection } from "../types";
import { isCustomizeSection } from "../types";

export type CustomizeTarget = {
  section: CustomizeSection;
  itemId?: string;
  field?: string;
  builderMode?: boolean;
};

type Props = {
  children: React.ReactNode;
  onSelect: (target: CustomizeTarget) => void;
};

export function resolveCustomizeTarget(
  target: EventTarget | null,
): CustomizeTarget | null {
  if (!(target instanceof Element)) return null;
  if (target.closest("[data-customize-ignore]")) {
    return null;
  }

  const fieldEl = target.closest<HTMLElement>("[data-customize-field]");
  const itemEl = target.closest<HTMLElement>("[data-customize-item]");
  const sectionEl =
    itemEl?.closest<HTMLElement>("[data-customize-section]") ??
    fieldEl?.closest<HTMLElement>("[data-customize-section]") ??
    target.closest<HTMLElement>("[data-customize-section]");
  if (!sectionEl) return null;

  const section = sectionEl.dataset.customizeSection;
  if (!section || !isCustomizeSection(section)) return null;

  return {
    section,
    itemId: itemEl?.dataset.customizeItem || undefined,
    field: fieldEl?.dataset.customizeField || undefined,
    builderMode:
      (section === "case-studies" || section === "slider") &&
      Boolean(itemEl?.dataset.customizeItem) &&
      Boolean(fieldEl?.dataset.customizeField?.startsWith("section-")),
  };
}

export const PreviewClickLayer = memo(function PreviewClickLayer({
  children,
  onSelect,
}: Props) {
  const selectFromEvent = useCallback(
    (event: React.SyntheticEvent) => {
      const resolved = resolveCustomizeTarget(event.target);
      if (!resolved) return false;

      if (event.target instanceof Element && event.target.closest("a")) {
        event.preventDefault();
      }

      event.preventDefault();
      event.stopPropagation();
      onSelect(resolved);
      return true;
    },
    [onSelect],
  );

  return (
    <div
      className="customize-preview-root h-full"
      onClickCapture={(event) => {
        selectFromEvent(event);
      }}
      onKeyDownCapture={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        if (
          !target.matches(
            "[data-customize-item], [data-customize-section], [data-customize-field]",
          )
        ) {
          return;
        }
        if (selectFromEvent(event) && event.key === " ") {
          event.preventDefault();
        }
      }}
    >
      {children}
    </div>
  );
});
