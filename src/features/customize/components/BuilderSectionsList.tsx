"use client";

import type {
  CollectionRowDragHandleProps,
  CollectionRowDragItemProps,
} from "./collectionListRowTypes";
import { BuilderSectionRow } from "./BuilderSectionRow";
import { EditorListFrame, EditorSectionHeader } from "./EditorSectionChrome";

type SectionItem = {
  id: string;
  type: string;
  is_visible: boolean;
};

type DragApi = {
  draggingIndex: number | null;
  overIndex: number | null;
  getHandleProps: (index: number) => CollectionRowDragHandleProps;
  getItemProps: (index: number) => CollectionRowDragItemProps;
};

type Props = {
  sections: SectionItem[];
  selectedSectionId?: string | null;
  labels: Record<string, string>;
  drag: DragApi;
  onSelect: (sectionId: string) => void;
  onMove: (sectionId: string, direction: "up" | "down") => void;
};

export function BuilderSectionsList({
  sections,
  selectedSectionId,
  labels,
  drag,
  onSelect,
  onMove,
}: Props) {
  return (
    <section className="space-y-2">
      <EditorSectionHeader title="Sections" count={sections.length} />
      <EditorListFrame>
        <ul>
          {sections.map((section, index) => (
            <li
              key={section.id}
              className={
                index < sections.length - 1
                  ? "border-b border-[#f0f0f0]"
                  : undefined
              }
            >
              <BuilderSectionRow
                index={index}
                total={sections.length}
                label={labels[section.type] ?? section.type}
                hidden={!section.is_visible}
                active={section.id === selectedSectionId}
                dragging={drag.draggingIndex === index}
                dropTarget={drag.overIndex === index}
                dragHandleProps={drag.getHandleProps(index)}
                dragItemProps={drag.getItemProps(index)}
                onSelect={() => onSelect(section.id)}
                onMove={(direction) => onMove(section.id, direction)}
              />
            </li>
          ))}
          {sections.length === 0 ? (
            <li className="px-3 py-6 text-center text-[12px] text-[#8a8a8a]">
              No sections yet.
            </li>
          ) : null}
        </ul>
      </EditorListFrame>
    </section>
  );
}
