"use client";

import { EditorSegmentTabs } from "./EditorSegmentTabs";

type Props = {
  onOpenCard: () => void;
};

/** Card | Page tabs while editing a detail page builder. */
export function BuilderModeTabs({ onOpenCard }: Props) {
  return (
    <EditorSegmentTabs
      ariaLabel="Item editor"
      value="page"
      options={[
        { id: "card", label: "Card" },
        { id: "page", label: "Page" },
      ]}
      onChange={(next) => {
        if (next === "card") onOpenCard();
      }}
    />
  );
}
