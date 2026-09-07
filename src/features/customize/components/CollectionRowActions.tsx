"use client";

import { CollectionRowAction } from "./CollectionRowAction";

type Props = {
  active: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
};

export function CollectionRowActions({
  active,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  return (
    <div className="flex shrink-0 items-center">
      <CollectionRowAction
        label="Move up"
        disabled={isFirst}
        active={active}
        onClick={onMoveUp}
      >
        ↑
      </CollectionRowAction>
      <CollectionRowAction
        label="Move down"
        disabled={isLast}
        active={active}
        onClick={onMoveDown}
      >
        ↓
      </CollectionRowAction>
      <CollectionRowAction
        label="Delete"
        active={active}
        danger
        onClick={onDelete}
      >
        ×
      </CollectionRowAction>
    </div>
  );
}
