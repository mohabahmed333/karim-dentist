"use client";

import { useState, type ReactNode } from "react";
import { EditorSegmentTabs } from "./EditorSegmentTabs";

type BuilderTab = "sections" | "layouts";

type Props = {
  sectionsPanel: ReactNode;
  layoutsPanel: ReactNode;
};

/** Sections vs Add layout tabs for case study / featured page builders. */
export function BuilderWorkbenchTabs({
  sectionsPanel,
  layoutsPanel,
}: Props) {
  const [tab, setTab] = useState<BuilderTab>("sections");

  return (
    <div className="space-y-3">
      <EditorSegmentTabs
        ariaLabel="Page builder tools"
        value={tab}
        options={[
          { id: "sections", label: "Sections" },
          { id: "layouts", label: "Add layout" },
        ]}
        onChange={setTab}
      />
      {tab === "sections" ? sectionsPanel : layoutsPanel}
    </div>
  );
}
