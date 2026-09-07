"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";
import { useCustomize } from "../context/CustomizeContext";
import {
  moveHomepageSection,
  normalizeHomepageSectionOrder,
  toggleHomepageSectionHidden,
  type HideableSectionKey,
} from "@/features/portfolio/lib/homepageSectionOrder";
import { CustomizeToolbarMenu } from "./CustomizeToolbarMenu";
import { HomepageVisibilityRow } from "./HomepageVisibilityRow";
import { useSortableListDrag } from "./useSortableListDrag";
import { SortableDragGhostLayer } from "./SortableDragGhostLayer";

export function CustomizeVisibilityMenu() {
  const { data, patchSettings } = useCustomize();
  const [open, setOpen] = useState(false);
  const settings = data.settings;
  const order = normalizeHomepageSectionOrder(settings?.homepage_section_order);
  const hidden = settings?.homepage_hidden_sections ?? [];

  const drag = useSortableListDrag((from, to) => {
    patchSettings({
      homepage_section_order: moveHomepageSection(order, from, to),
    });
  });

  function onToggleHidden(key: HideableSectionKey) {
    patchSettings({
      homepage_hidden_sections: toggleHomepageSectionHidden(hidden, key),
    });
  }

  if (!settings) return null;

  return (
    <>
      <CustomizeToolbarMenu
        open={open}
        onOpenChange={setOpen}
        labelledBy="customize-visibility-title"
        panelClassName="w-[min(300px,calc(100vw-1.5rem))]"
        trigger={
          <button
            type="button"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen((value) => !value)}
            className="rounded-[6px] px-2 py-1 text-[11px] text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
          >
            Customise
          </button>
        }
      >
        <div className="flex items-center justify-between border-b border-[#f0f0f0] px-3 py-2">
          <p
            id="customize-visibility-title"
            className="text-[13px] font-semibold text-[#1a1a1a]"
          >
            Customise
          </p>
          <button
            type="button"
            aria-label="Close"
            className="rounded p-0.5 text-[#8a8a8a] hover:bg-[#f0f0f0] hover:text-[#1a1a1a]"
            onClick={() => setOpen(false)}
          >
            <XIcon className="size-3.5" />
          </button>
        </div>
        <p className="px-3 pt-2 text-[10px] leading-4 text-[#8a8a8a]">
          Show or hide homepage sections. Drag to reorder. Save to publish.
        </p>
        <ul className="max-h-72 overflow-y-auto px-1 py-1.5">
          {order.map((key, index) => (
            <HomepageVisibilityRow
              key={key}
              sectionKey={key}
              index={index}
              hidden={hidden}
              drag={drag}
              onToggle={() => onToggleHidden(key)}
            />
          ))}
        </ul>
      </CustomizeToolbarMenu>
      <SortableDragGhostLayer ghost={drag.dragGhost} />
    </>
  );
}
