"use client";

import { useCustomize } from "../context/CustomizeContext";
import {
  moveHomepageSection,
  normalizeHomepageSectionOrder,
  toggleHomepageSectionHidden,
  type HideableSectionKey,
} from "@/features/portfolio/lib/homepageSectionOrder";
import { HomepageSectionOrderList } from "@/features/portfolio/components/HomepageSectionOrderList";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { HomepageSectionTitlesCustomizeFields } from "./HomepageSectionTitlesCustomizeFields";
import { SortableDragGhostLayer } from "./SortableDragGhostLayer";
import { useSortableListDrag } from "./useSortableListDrag";

export function HomepageOrderFields() {
  const { data, patchSettings } = useCustomize();
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
    <section className="space-y-6" data-tour="homepage-order">
      <div className="space-y-2">
        <EditorSectionHeader title="Homepage order" />
        <p className="text-[11px] leading-4 text-[#8a8a8a]">
          Hero stays first. Drag sections below it, hide any you do not need, then Save.
        </p>
        <EditorFieldCard>
          <HomepageSectionOrderList
            order={order}
            hidden={hidden}
            onToggleHidden={onToggleHidden}
            getHandleProps={drag.getHandleProps}
            getItemProps={drag.getItemProps}
            overIndex={drag.overIndex}
            draggingIndex={drag.draggingIndex}
          />
        </EditorFieldCard>
        <SortableDragGhostLayer ghost={drag.dragGhost} />
      </div>
      <HomepageSectionTitlesCustomizeFields
        settings={settings}
        patchSettings={patchSettings}
      />
    </section>
  );
}
