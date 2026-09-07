"use client";

import { CollectionListRow } from "./CollectionListRow";
import type {
  CollectionRowDragHandleProps,
  CollectionRowDragItemProps,
} from "./collectionListRowTypes";

type Item = {
  id: string;
  label: string;
  year: string | null;
};

type DragApi = {
  draggingIndex: number | null;
  overIndex: number | null;
  getHandleProps: (index: number) => CollectionRowDragHandleProps;
  getItemProps: (index: number) => CollectionRowDragItemProps;
};

type Props = {
  items: Item[];
  filtering: boolean;
  activeId: string | null;
  drag: DragApi;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (id: string) => void;
};

export function CollectionItemsList({
  items,
  filtering,
  activeId,
  drag,
  onMoveUp,
  onMoveDown,
  onDelete,
  onSelect,
}: Props) {
  return (
    <ul className="overflow-hidden rounded-[8px] border border-[#ebebeb] bg-white">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={
            index < items.length - 1 ? "border-b border-[#f0f0f0]" : undefined
          }
        >
          <CollectionListRow
            label={item.label}
            year={item.year}
            active={activeId === item.id}
            isFirst={index === 0}
            isLast={index === items.length - 1}
            dragging={drag.draggingIndex === index}
            dropTarget={drag.overIndex === index}
            dragDisabled={filtering}
            dragHandleProps={drag.getHandleProps(index)}
            dragItemProps={drag.getItemProps(index)}
            onMoveUp={() => onMoveUp(item.id)}
            onMoveDown={() => onMoveDown(item.id)}
            onDelete={() => onDelete(item.id)}
            onSelect={() => onSelect(item.id)}
          />
        </li>
      ))}
      {items.length === 0 ? (
        <li className="px-3 py-6 text-center text-[12px] text-[#8a8a8a]">
          {filtering ? "No matches for this search." : "No items yet."}
        </li>
      ) : null}
    </ul>
  );
}
