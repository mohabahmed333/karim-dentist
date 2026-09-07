"use client";

import { Button } from "@/components/ui/button";
import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import type { Tables } from "@/lib/supabase/database.types";
import { isReservedFooterLink } from "@/features/portfolio/lib/footerLinkHref";
import { footerLinkLabel } from "../lib/footerColumns";
import {
  EditorListFrame,
  EditorSectionHeader,
} from "./EditorSectionChrome";
import { CollectionListRow } from "./CollectionListRow";
import { SortableDragGhostLayer } from "./SortableDragGhostLayer";
import { useSortableListDrag } from "./useSortableListDrag";

type Props = {
  title: string;
  columnKey: "portfolio" | "follow";
  items: Tables<"footer_links">[];
};

export function FooterColumnList({ title, columnKey, items }: Props) {
  const {
    addFooterLink,
    reorderCollection,
    reorderFooterColumnToIndex,
    removeCollectionItem,
  } = useCustomize();
  const { route, navigate } = useCustomizeRoute();
  const drag = useSortableListDrag((from, to) =>
    reorderFooterColumnToIndex(columnKey, from, to),
  );

  return (
    <section className="space-y-2">
      <EditorSectionHeader
        title={title}
        count={items.length}
        action={
          <Button
            type="button"
            size="sm"
            className="h-7 rounded-[6px] bg-[#1a1a1a] px-2.5 text-[11px] text-white hover:bg-[#333]"
            onClick={() => {
              void addFooterLink(columnKey).then((id) => {
                if (id) navigate({ section: "footer", itemId: id });
              });
            }}
          >
            Add
          </Button>
        }
      />
      <EditorListFrame>
        <ul>
          {items.map((item, index) => {
            const locked = isReservedFooterLink(item);
            return (
              <li
                key={item.id}
                className={
                  index < items.length - 1
                    ? "border-b border-[#f0f0f0]"
                    : undefined
                }
              >
                <CollectionListRow
                  label={
                    locked
                      ? `${footerLinkLabel(item)} · opens contact form`
                      : footerLinkLabel(item)
                  }
                  year={null}
                  locked={locked}
                  active={
                    !locked &&
                    route.itemId === item.id &&
                    route.section === "footer"
                  }
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  dragging={!locked && drag.draggingIndex === index}
                  dropTarget={!locked && drag.overIndex === index}
                  dragDisabled={locked}
                  dragHandleProps={
                    locked ? undefined : drag.getHandleProps(index)
                  }
                  dragItemProps={
                    locked ? undefined : drag.getItemProps(index)
                  }
                  onMoveUp={() => {
                    if (!locked) reorderCollection("footer", item.id, "up");
                  }}
                  onMoveDown={() => {
                    if (!locked) reorderCollection("footer", item.id, "down");
                  }}
                  onDelete={() => {
                    if (!locked) void removeCollectionItem("footer", item.id);
                  }}
                  onSelect={() => {
                    if (!locked) {
                      navigate({ section: "footer", itemId: item.id });
                    }
                  }}
                />
              </li>
            );
          })}
          {items.length === 0 ? (
            <li className="px-3 py-6 text-center text-[12px] text-[#8a8a8a]">
              No links yet.
            </li>
          ) : null}
        </ul>
      </EditorListFrame>
      <SortableDragGhostLayer ghost={drag.dragGhost} />
    </section>
  );
}
