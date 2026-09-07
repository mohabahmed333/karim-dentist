"use client";

import { Button } from "@/components/ui/button";
import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import { CollectionItemsList } from "./CollectionItemsList";
import { EditorSectionHeader } from "./EditorSectionChrome";
import { SortableDragGhostLayer } from "./SortableDragGhostLayer";
import { useSortableListDrag } from "./useSortableListDrag";

function comparisonLabel(
  altText: string,
  index: number,
): string {
  const alt = altText.trim();
  return alt || `Comparison ${index + 1}`;
}

export function GalleryComparisonsList() {
  const {
    data,
    addGalleryComparison,
    removeGalleryComparison,
    reorderGalleryComparison,
    reorderGalleryComparisonToIndex,
  } = useCustomize();
  const { route, navigate } = useCustomizeRoute();
  const comparisons = [...(data.galleryComparisons ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  const drag = useSortableListDrag((from, to) =>
    reorderGalleryComparisonToIndex(from, to),
  );

  const listItems = comparisons.map((item, index) => ({
    id: item.id,
    label: comparisonLabel(item.alt_text, index),
    year: null,
  }));

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <EditorSectionHeader title="Comparisons" count={comparisons.length} />
        <Button
          type="button"
          size="sm"
          className="h-8 shrink-0 rounded-[6px] bg-[#1a1a1a] px-3 text-xs text-white hover:bg-[#333]"
          onClick={() => {
            void addGalleryComparison().then((id) => {
              if (id) navigate({ section: "gallery", itemId: id });
            });
          }}
        >
          Add
        </Button>
      </div>
      <CollectionItemsList
        items={listItems}
        filtering={false}
        activeId={route.section === "gallery" ? route.itemId : null}
        drag={drag}
        onMoveUp={(id) => reorderGalleryComparison(id, "up")}
        onMoveDown={(id) => reorderGalleryComparison(id, "down")}
        onDelete={(id) => void removeGalleryComparison(id)}
        onSelect={(id) => navigate({ section: "gallery", itemId: id })}
      />
      <SortableDragGhostLayer ghost={drag.dragGhost} />
    </section>
  );
}
