"use client";

import { useEffect, useState } from "react";
import { useCustomize } from "../context/CustomizeContext";
import { useFocusEditorField } from "./useFocusEditorField";
import { DentalSectionCopyFields } from "./DentalSectionCopyFields";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { EditorSegmentTabs } from "./EditorSegmentTabs";
import { GalleryComparisonsList } from "./GalleryComparisonsList";

type Tab = "copy" | "items";

type Props = {
  focusField?: string | null;
};

function tabFromFocus(focusField?: string | null): Tab {
  if (
    focusField === "gallery_title" ||
    focusField === "gallery_heading" ||
    focusField === "gallery_description"
  ) {
    return "copy";
  }
  return "items";
}

export function GalleryPanel({ focusField }: Props) {
  const [tab, setTab] = useState<Tab>(() => tabFromFocus(focusField));
  const { data, patchSettings } = useCustomize();
  const copyRef = useFocusEditorField(
    tab === "copy" ? focusField : null,
    "gallery",
  );
  const comparisons = data.galleryComparisons ?? [];
  const settings = data.settings;

  useEffect(() => {
    setTab(tabFromFocus(focusField));
  }, [focusField]);

  if (!settings) {
    return <p className="text-sm text-[#8a8a8a]">No settings row.</p>;
  }

  return (
    <EditorPanelShell>
      <div className="flex items-center justify-between gap-2">
        <EditorSectionHeader
          title="Successful Cases"
          count={comparisons.length}
        />
        <EditorOpenPageLink href="/#gallery" />
      </div>
      <EditorSegmentTabs
        ariaLabel="Successful cases editor"
        value={tab}
        options={[
          { id: "copy", label: "Section copy" },
          { id: "items", label: "Comparisons" },
        ]}
        onChange={setTab}
      />
      {tab === "copy" ? (
        <div ref={copyRef}>
          <EditorFieldCard>
            <DentalSectionCopyFields
              section="gallery"
              settings={settings}
              patchSettings={patchSettings}
            />
          </EditorFieldCard>
        </div>
      ) : null}
      {tab === "items" ? <GalleryComparisonsList /> : null}
    </EditorPanelShell>
  );
}
