"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  caseStudyId: string;
  selectedSectionId?: string | null;
};

export function CaseStudyPageBuilderPanel({
  caseStudyId,
  selectedSectionId,
}: Props) {
  const {
    data,
    addCaseStudySection,
    reorderCaseStudySection,
    reorderCaseStudySectionToIndex,
  } = useCustomize();
  const { openCaseStudyCard, navigate } = useCustomizeRoute();
  const [adding, setAdding] = useState(false);
  const study = data.caseStudies.find((item) => item.id === caseStudyId);
  const sections = data.caseStudySections[caseStudyId] ?? [];
  const selected = sections.find((s) => s.id === selectedSectionId);
  const drag = useSortableListDrag((from, to) =>
    reorderCaseStudySectionToIndex(caseStudyId, from, to),
  );

  if (!study) {
    return <p className="text-sm text-[#8a8a8a]">Case study not found.</p>;
  }

  const handleAdd = (item: LayoutCatalogItem) => {
    setAdding(true);
    void addCaseStudySection(caseStudyId, item.type, {
      layoutVariant: item.layoutVariant,
      content: item.content,
    }).finally(() => setAdding(false));
  };

  const slug = study.slug?.trim();
  const viewHref = slug ? `/case-studies/${slug}` : "/case-studies";

  return (
    <EditorPanelShell>
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 rounded-[6px] px-2 text-xs"
          onClick={() => openCaseStudyCard(caseStudyId)}
        >
          ← Card
        </Button>
        <EditorOpenPageLink href={viewHref} />
      </div>
      <BuilderModeTabs onOpenCard={() => openCaseStudyCard(caseStudyId)} />
      <div className="space-y-0.5 px-0.5">
        <EditorSectionHeader title="Page builder" />
        <p className="text-[12px] font-semibold">{study.title}</p>
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
                  section: "case-studies",
                  itemId: caseStudyId,
                  builderMode: true,
                  field: `section-${sectionId}`,
                })
              }
              onMove={(sectionId, direction) =>
                reorderCaseStudySection(caseStudyId, sectionId, direction)
              }
            />
            {selected ? (
              <CaseStudySectionInspector
                parentId={caseStudyId}
                section={selected}
                collection="case-studies"
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
