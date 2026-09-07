"use client";

import { useCustomize } from "../context/CustomizeContext";
import { ControlledField } from "./ControlledField";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { EditorSectionHeader } from "./EditorSectionChrome";

export function SolutionsPanel() {
  const { data } = useCustomize();
  const panels = data.solutionPanels ?? [];

  return (
    <EditorPanelShell>
      <div className="flex items-center justify-between gap-2">
        <EditorSectionHeader title="Solution panels" count={panels.length} />
        <EditorOpenPageLink href="/#services" />
      </div>
      <p className="text-[10px] leading-relaxed text-[#8a8a8a]">
        Solution highlight panels appear above the service cards grid.
      </p>
      {panels.map((panel) => (
        <div key={panel.id} className="space-y-2 rounded-md border border-[#e8e8e8] p-3">
          <ControlledField label="Title" value={panel.title} onChange={() => undefined} />
          <ControlledField
            label="Body"
            value={panel.body}
            onChange={() => undefined}
            multiline
          />
        </div>
      ))}
    </EditorPanelShell>
  );
}
