export type CollectionRowDragHandleProps = {
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<Element>) => void;
  onDragEnd?: () => void;
};

export type CollectionRowDragItemProps = {
  onDragOver?: (event: React.DragEvent) => void;
  onDrop?: (event: React.DragEvent) => void;
  onDragLeave?: (event: React.DragEvent) => void;
};

export type CollectionListRowProps = {
  label: string;
  year: string | null;
  active: boolean;
  isFirst: boolean;
  isLast: boolean;
  locked?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  dragDisabled?: boolean;
  dragHandleProps?: CollectionRowDragHandleProps;
  dragItemProps?: CollectionRowDragItemProps;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
  onSelect: () => void;
};
