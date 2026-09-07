"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import type { CollectionSection } from "../types";
import { collectionItems, itemLabel } from "../lib/collectionMeta";
import { CollectionItemsList } from "./CollectionItemsList";
import { CollectionPageIntroFields } from "./CollectionPageIntroFields";
import { EditorSectionHeader } from "./EditorSectionChrome";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { ServicesGroupedList } from "./ServicesGroupedList";
import { SortableDragGhostLayer } from "./SortableDragGhostLayer";
import { useSortableListDrag } from "./useSortableListDrag";

type Props = { section: CollectionSection };

function listViewHref(section: CollectionSection) {
  if (section === "case-studies") return "/case-studies";
  if (section === "slider") return "/#more-images";
  if (section === "services") return "/#services";
  return "/";
}

export function CollectionListPanel({ section }: Props) {
  const {
    data,
    addCollectionItem,
    reorderCollection,
    reorderCollectionToIndex,
    removeCollectionItem,
  } = useCustomize();
  const { route, navigate } = useCustomizeRoute();
  const [query, setQuery] = useState("");
  const items = collectionItems(data, section);
  const filtering = Boolean(query.trim());

  const filtered = filtering
    ? items.filter((item) =>
        itemLabel(item).toLowerCase().includes(query.trim().toLowerCase()),
      )
    : items;

  const drag = useSortableListDrag(
    (from, to) => reorderCollectionToIndex(section, from, to),
    filtering,
  );

  const listItems = filtered.map((item) => ({
    id: item.id,
    label: itemLabel(item),
    year:
      typeof item.year === "string" || typeof item.year === "number"
        ? String(item.year)
        : null,
  }));

  return (
    <EditorPanelShell>
      <CollectionPageIntroFields section={section} />
      {section === "services" ? (
        <ServicesGroupedList query={query} onQueryChange={setQuery} />
      ) : (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <EditorSectionHeader
              title="Items"
              count={
                filtering ? `${filtered.length}/${items.length}` : items.length
              }
            />
            <EditorOpenPageLink href={listViewHref(section)} />
          </div>
          <div
            className="flex items-center gap-1.5"
            data-tour="collection-toolbar"
          >
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
              aria-label="Search items"
              data-tour="collection-search"
              className="h-8 rounded-[6px] border-[#e5e5e5] bg-white text-xs shadow-none"
            />
            <Button
              type="button"
              size="sm"
              data-tour="collection-add"
              className="h-8 shrink-0 rounded-[6px] bg-[#1a1a1a] px-3 text-xs text-white hover:bg-[#333]"
              onClick={() => {
                void addCollectionItem(section).then((id) => {
                  if (id) navigate({ section, itemId: id });
                });
              }}
            >
              Add
            </Button>
          </div>
          <div data-tour="collection-list">
            <CollectionItemsList
              items={listItems}
              filtering={filtering}
              activeId={route.section === section ? route.itemId : null}
              drag={drag}
              onMoveUp={(id) => reorderCollection(section, id, "up")}
              onMoveDown={(id) => reorderCollection(section, id, "down")}
              onDelete={(id) => void removeCollectionItem(section, id)}
              onSelect={(id) => navigate({ section, itemId: id })}
            />
          </div>
          <SortableDragGhostLayer ghost={drag.dragGhost} />
        </section>
      )}
    </EditorPanelShell>
  );
}
