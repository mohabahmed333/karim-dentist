"use client";

import { EditorSegmentTabs } from "./EditorSegmentTabs";
import type { CollectionSection } from "../types";

type Props = {
  section: CollectionSection;
  id: string;
  openCaseStudyBuilder: (id: string) => void;
  openFeaturedBuilder: (id: string) => void;
};

export function CollectionItemPageTabs({
  section,
  id,
  openCaseStudyBuilder,
  openFeaturedBuilder,
}: Props) {
  if (section !== "case-studies" && section !== "slider") return null;

  return (
    <EditorSegmentTabs
      ariaLabel="Item editor"
      value="card"
      options={[
        { id: "card", label: "Card" },
        { id: "page", label: "Page" },
      ]}
      onChange={(next) => {
        if (next !== "page") return;
        if (section === "case-studies") openCaseStudyBuilder(id);
        else openFeaturedBuilder(id);
      }}
    />
  );
}
