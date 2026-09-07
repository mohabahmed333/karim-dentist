"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  groupServicesByKind,
  matchesServiceKind,
  type ServiceKind,
} from "@/features/portfolio/lib/serviceKindGroups";
import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import { itemLabel } from "../lib/collectionMeta";
import { CollectionItemsList } from "./CollectionItemsList";
import { EditorSectionHeader } from "./EditorSectionChrome";
import { SortableDragGhostLayer } from "./SortableDragGhostLayer";
import { useSortableListDrag } from "./useSortableListDrag";

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
};

function reorderKindItems<T extends { id: string; sort_order: number }>(
  items: T[],
  fromIndex: number,
  toIndex: number,
): T[] {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) return items;
  next.splice(toIndex, 0, moved);
  const orders = items.map((item) => item.sort_order);
  return next.map((item, index) => ({
    ...item,
    sort_order: orders[index] ?? item.sort_order,
  }));
}

function ServiceKindGroupList({
  title,
  kind,
  items,
  filtering,
  activeId,
  onAdd,
  onSelect,
  onDelete,
  onReorderLocal,
  onMoveLocal,
}: {
  title: string;
  kind: ServiceKind;
  items: Array<{ id: string; label: string; year: string | null }>;
  filtering: boolean;
  activeId: string | null;
  onAdd: (kind: ServiceKind) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onReorderLocal: (kind: ServiceKind, from: number, to: number) => void;
  onMoveLocal: (kind: ServiceKind, id: string, direction: "up" | "down") => void;
}) {
  const drag = useSortableListDrag(
    (from, to) => onReorderLocal(kind, from, to),
    filtering,
  );

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <EditorSectionHeader title={title} count={items.length} />
        <Button
          type="button"
          size="sm"
          className="h-7 shrink-0 rounded-[6px] bg-[#1a1a1a] px-2.5 text-[11px] text-white hover:bg-[#333]"
          onClick={() => onAdd(kind)}
        >
          Add
        </Button>
      </div>
      <CollectionItemsList
        items={items}
        filtering={filtering}
        activeId={activeId}
        drag={drag}
        onMoveUp={(id) => onMoveLocal(kind, id, "up")}
        onMoveDown={(id) => onMoveLocal(kind, id, "down")}
        onDelete={onDelete}
        onSelect={onSelect}
      />
      <SortableDragGhostLayer ghost={drag.dragGhost} />
    </section>
  );
}

export function ServicesGroupedList({ query, onQueryChange }: Props) {
  const { data, addCollectionItem, patchCollectionItem, removeCollectionItem } =
    useCustomize();
  const { route, navigate } = useCustomizeRoute();
  const filtering = Boolean(query.trim());

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupServicesByKind(data.services ?? []).map((group) => ({
      kind: group.kind,
      title: group.title,
      items: (q
        ? group.items.filter((item) =>
            itemLabel(item).toLowerCase().includes(q),
          )
        : group.items
      ).map((item) => ({
        id: item.id,
        label: itemLabel(item),
        year: null as string | null,
      })),
    }));
  }, [data.services, query]);

  const kindSource = (kind: ServiceKind) =>
    (data.services ?? [])
      .filter((item) => matchesServiceKind(item, kind))
      .sort((a, b) => a.sort_order - b.sort_order);

  const applyKindOrder = (
    ordered: Array<{ id: string; sort_order: number }>,
  ) => {
    for (const item of ordered) {
      patchCollectionItem("services", item.id, { sort_order: item.sort_order });
    }
  };

  return (
    <div className="space-y-4">
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Search services…"
        aria-label="Search services"
        data-tour="collection-search"
        className="h-8 rounded-[6px] border-[#e5e5e5] bg-white text-xs shadow-none"
      />
      {groups.map((group) => (
        <ServiceKindGroupList
          key={group.kind}
          title={group.title}
          kind={group.kind}
          items={group.items}
          filtering={filtering}
          activeId={route.section === "services" ? route.itemId : null}
          onAdd={(kind) => {
            void addCollectionItem("services").then((id) => {
              if (!id) return;
              patchCollectionItem("services", id, { kind });
              navigate({ section: "services", itemId: id });
            });
          }}
          onSelect={(id) => navigate({ section: "services", itemId: id })}
          onDelete={(id) => void removeCollectionItem("services", id)}
          onReorderLocal={(kind, from, to) => {
            applyKindOrder(reorderKindItems(kindSource(kind), from, to));
          }}
          onMoveLocal={(kind, id, direction) => {
            const source = kindSource(kind);
            const index = source.findIndex((item) => item.id === id);
            if (index < 0) return;
            const target = direction === "up" ? index - 1 : index + 1;
            applyKindOrder(reorderKindItems(source, index, target));
          }}
        />
      ))}
    </div>
  );
}
