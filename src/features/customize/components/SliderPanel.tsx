"use client";

import { useCustomize } from "../context/CustomizeContext";
import { useFocusEditorField } from "./useFocusEditorField";
import { CollectionListPanel } from "./CollectionListPanel";
import { DentalSectionCopyFields } from "./DentalSectionCopyFields";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";

type Props = {
  focusField?: string | null;
};

export function SliderPanel({ focusField }: Props) {
  const { data, patchSettings } = useCustomize();
  const copyRef = useFocusEditorField(focusField, "slider");
  const settings = data.settings;
  if (!settings) {
    return <p className="text-sm text-[#8a8a8a]">No settings row.</p>;
  }

  return (
    <EditorPanelShell>
      <div className="flex items-center justify-between gap-2">
        <EditorSectionHeader title="More Images" />
        <EditorOpenPageLink href="/#more-images" />
      </div>
      <div ref={copyRef}>
        <EditorFieldCard>
          <DentalSectionCopyFields
            section="slider"
            settings={settings}
            patchSettings={patchSettings}
          />
        </EditorFieldCard>
      </div>
      <CollectionListPanel section="slider" />
    </EditorPanelShell>
  );
}
