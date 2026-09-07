"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { featuredProjectPath } from "@/features/portfolio/lib/featuredProjectPath";
import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import {
  SECTION_TYPE_LABELS,
  type LayoutCatalogItem,
} from "../lib/layoutCatalog";
import { BuilderSectionsList } from "./BuilderSectionsList";
import { BuilderModeTabs } from "./BuilderModeTabs";
import { BuilderWorkbenchTabs } from "./BuilderWorkbenchTabs";
import { CaseStudyLayoutLibrary } from "./CaseStudyLayoutLibrary";
import { CaseStudySectionInspector } from "./CaseStudySectionInspector";
import { EditorSectionHeader } from "./EditorSectionChrome";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { SortableDragGhostLayer } from "./SortableDragGhostLayer";
import { useSortableListDrag } from "./useSortableListDrag";

type Props = {
  featuredProjectId: string;
  selectedSectionId?: string | null;
};

export function FeaturedPageBuilderPanel({
  featuredProjectId,
  selectedSectionId,
}: Props) {
  const {
    data,
    addFeaturedSection,
    reorderFeaturedSection,
    reorderFeaturedSectionToIndex,
  } = useCustomize();
  const { openFeaturedCard, navigate } = useCustomizeRoute();
  const [adding, setAdding] = useState(false);
  const project = data.featured.find((item) => item.id === featuredProjectId);
  const sections = data.featuredProjectSections[featuredProjectId] ?? [];
  const selected = sections.find((s) => s.id === selectedSectionId);
  const drag = useSortableListDrag((from, to) =>
    reorderFeaturedSectionToIndex(featuredProjectId, from, to),
  );

  if (!project) {
    return (
      <p className="text-sm text-[#8a8a8a]">Featured project not found.</p>
    );
  }

  const handleAdd = (item: LayoutCatalogItem) => {
    setAdding(true);
    void addFeaturedSection(featuredProjectId, item.type, {
      layoutVariant: item.layoutVariant,
      content: item.content,
    }).finally(() => setAdding(false));
  };

  return (
    <EditorPanelShell>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 rounded-[6px] px-2 text-xs"
          onClick={() => openFeaturedCard(featuredProjectId)}
        >
          ← Card
        </Button>
        <EditorOpenPageLink
          href={featuredProjectPath(project.slug) ?? "/featured"}
        />
      </div>
      <BuilderModeTabs onOpenCard={() => openFeaturedCard(featuredProjectId)} />
      <div className="space-y-0.5 px-0.5">
        <EditorSectionHeader title="Page builder" />
        <p className="text-[12px] font-semibold">{project.title}</p>
      </div>
      <BuilderWorkbenchTabs
        sectionsPanel={
          <div className="space-y-3">
            <BuilderSectionsList
              sections={sections}
              selectedSectionId={selectedSectionId}
              labels={SECTION_TYPE_LABELS}
              drag={drag}
              onSelect={(sectionId) =>
                navigate({
                  section: "slider",
                  itemId: featuredProjectId,
                  builderMode: true,
                  field: `section-${sectionId}`,
                })
              }
              onMove={(sectionId, direction) =>
                reorderFeaturedSection(featuredProjectId, sectionId, direction)
              }
            />
            {selected ? (
              <CaseStudySectionInspector
                parentId={featuredProjectId}
                section={selected}
                collection="featured"
              />
            ) : (
              <p className="px-0.5 text-[11px] text-[#8a8a8a]">
                Select a section to edit its content and layout.
              </p>
            )}
          </div>
        }
        layoutsPanel={
          <CaseStudyLayoutLibrary onAdd={handleAdd} busy={adding} />
        }
      />
      <SortableDragGhostLayer ghost={drag.dragGhost} />
    </EditorPanelShell>
  );
}
