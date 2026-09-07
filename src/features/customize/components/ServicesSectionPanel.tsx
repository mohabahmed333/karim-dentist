"use client";

import { useEffect, useState } from "react";
import { MediaUploadField } from "@/features/admin/components/MediaUploadField";
import { useCustomize } from "../context/CustomizeContext";
import { useFocusEditorField } from "./useFocusEditorField";
import { useFocusEditorItem } from "../lib/dentalCustomize";
import { BilingualField } from "./BilingualField";
import { ControlledField } from "./ControlledField";
import { CollectionListPanel } from "./CollectionListPanel";
import { DentalSectionCopyFields } from "./DentalSectionCopyFields";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorFieldShell } from "./EditorFieldShell";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { EditorSegmentTabs } from "./EditorSegmentTabs";

type Tab = "copy" | "panels" | "services";

type Props = {
  focusPanelId?: string;
  focusField?: string | null;
};

function tabFromFocus(focusField?: string | null): Tab {
  if (
    focusField === "solutions_title" ||
    focusField === "solutions_description" ||
    focusField === "services_title" ||
    focusField === "services_heading" ||
    focusField === "services_description"
  ) {
    return "copy";
  }
  if (focusField === "title" || focusField === "body" || focusField === "image_url") {
    return "panels";
  }
  return "panels";
}

export function ServicesSectionPanel({ focusPanelId, focusField }: Props) {
  const [tab, setTab] = useState<Tab>(() => tabFromFocus(focusField));
  const { data, patchSolutionPanel, patchSettings } = useCustomize();
  const copyRef = useFocusEditorField(
    tab === "copy" ? focusField : null,
    focusPanelId ?? "services",
  );
  const panelsRef = useFocusEditorItem(focusPanelId, focusField);

  useEffect(() => {
    setTab(tabFromFocus(focusField));
  }, [focusField]);

  const settings = data.settings;
  if (!settings) {
    return <p className="text-sm text-[#8a8a8a]">No settings row.</p>;
  }

  return (
    <EditorPanelShell>
      <div className="flex items-center justify-between gap-2">
        <EditorSectionHeader title="Services" />
        <EditorOpenPageLink href="/#services" />
      </div>
      <EditorSegmentTabs
        ariaLabel="Services editor"
        value={tab}
        options={[
          { id: "copy", label: "Section copy" },
          { id: "panels", label: "Solution panels" },
          { id: "services", label: "Service cards" },
        ]}
        onChange={setTab}
      />
      {tab === "copy" ? (
        <div ref={copyRef}>
          <EditorFieldCard>
            <DentalSectionCopyFields
              section="services"
              settings={settings}
              patchSettings={patchSettings}
            />
          </EditorFieldCard>
        </div>
      ) : null}
      {tab === "panels" ? (
        <div ref={panelsRef}>
          <EditorFieldCard>
          {data.solutionPanels.map((panel) => (
            <div
              key={panel.id}
              data-editor-item={panel.id}
              className="space-y-2 rounded-md border border-[#ececec] p-3"
            >
              <EditorFieldShell field="title">
                <BilingualField
                  label="Title"
                  valueEn={panel.title}
                  valueAr={panel.title_ar ?? ""}
                  onChangeEn={(title) =>
                    patchSolutionPanel(panel.id, { title })
                  }
                  onChangeAr={(title_ar) =>
                    patchSolutionPanel(panel.id, { title_ar })
                  }
                  idPrefix={`panel-title-${panel.id}`}
                />
              </EditorFieldShell>
              <EditorFieldShell field="body">
                <BilingualField
                  label="Body"
                  valueEn={panel.body}
                  valueAr={panel.body_ar ?? ""}
                  onChangeEn={(body) => patchSolutionPanel(panel.id, { body })}
                  onChangeAr={(body_ar) =>
                    patchSolutionPanel(panel.id, { body_ar })
                  }
                  multiline
                  idPrefix={`panel-body-${panel.id}`}
                />
              </EditorFieldShell>
              <EditorFieldShell field="image_url">
                <MediaUploadField
                  label="Image"
                  bucket="about"
                  folder="solutions"
                  mediaType="image"
                  onMediaTypeChange={() => undefined}
                  value={panel.image_url || null}
                  onChange={(image_url) =>
                    patchSolutionPanel(panel.id, { image_url: image_url ?? "" })
                  }
                />
              </EditorFieldShell>
              <ControlledField
                label="Link href"
                value={panel.link_href ?? ""}
                onChange={(link_href) =>
                  patchSolutionPanel(panel.id, { link_href: link_href || null })
                }
              />
            </div>
          ))}
          </EditorFieldCard>
        </div>
      ) : null}
      {tab === "services" ? <CollectionListPanel section="services" /> : null}
    </EditorPanelShell>
  );
}
