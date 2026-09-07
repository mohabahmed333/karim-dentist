"use client";

import { useEffect, useState } from "react";
import { MediaUploadField, type MediaKind } from "@/features/admin/components/MediaUploadField";
import { useCustomize } from "../context/CustomizeContext";
import { useFocusEditorField } from "./useFocusEditorField";
import { useFocusEditorItem } from "../lib/dentalCustomize";
import { BilingualField } from "./BilingualField";
import { DentalSectionCopyFields } from "./DentalSectionCopyFields";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorFieldShell } from "./EditorFieldShell";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { EditorSegmentTabs } from "./EditorSegmentTabs";

type Tab = "copy" | "story" | "media" | "trust";

type Props = {
  focusTrustId?: string;
  focusField?: string | null;
};

function tabFromFocus(focusField?: string | null): Tab {
  if (focusField === "about_title") return "copy";
  if (focusField === "body") return "story";
  if (focusField === "image_url" || focusField === "copy_image_url") return "media";
  if (focusField === "value" || focusField === "label") return "trust";
  return "story";
}

export function AboutPanel({ focusTrustId, focusField }: Props) {
  const { data, patchAbout, patchTrustItem, patchSettings } = useCustomize();
  const [tab, setTab] = useState<Tab>(() => tabFromFocus(focusField));
  const copyRef = useFocusEditorField(
    tab === "copy" ? focusField : null,
    focusTrustId ?? "about",
  );
  const storyRef = useFocusEditorField(
    tab === "story" ? focusField : null,
    focusTrustId ?? "about",
  );
  const mediaRef = useFocusEditorField(
    tab === "media" ? focusField : null,
    focusTrustId ?? "about",
  );
  const trustRef = useFocusEditorItem(focusTrustId, focusField);
  const about = data.about;
  const settings = data.settings;

  useEffect(() => {
    setTab(tabFromFocus(focusField));
  }, [focusField]);

  if (!about || !settings) {
    return <p className="text-sm text-[#8a8a8a]">No about row.</p>;
  }

  return (
    <EditorPanelShell>
      <div className="flex items-center justify-between gap-2">
        <EditorSectionHeader title="About" />
        <EditorOpenPageLink href="/#about" />
      </div>
      <EditorSegmentTabs
        ariaLabel="About editor"
        value={tab}
        options={[
          { id: "copy", label: "Section copy" },
          { id: "story", label: "Story" },
          { id: "media", label: "Media" },
          { id: "trust", label: "Trust row" },
        ]}
        onChange={setTab}
      />
      {tab === "copy" ? (
        <div ref={copyRef}>
          <EditorFieldCard>
            <DentalSectionCopyFields
              section="about"
              settings={settings}
              patchSettings={patchSettings}
            />
          </EditorFieldCard>
        </div>
      ) : null}
      {tab === "story" ? (
        <div ref={storyRef}>
          <EditorFieldCard>
            <EditorFieldShell field="body">
              <BilingualField
                label="Body"
                valueEn={about.body}
                valueAr={about.body_ar ?? ""}
                onChangeEn={(body) => patchAbout({ body })}
                onChangeAr={(body_ar) => patchAbout({ body_ar })}
                multiline
                idPrefix="about-body"
              />
            </EditorFieldShell>
          </EditorFieldCard>
        </div>
      ) : null}
      {tab === "media" ? (
        <div ref={mediaRef}>
          <EditorFieldCard>
            <EditorFieldShell field="copy_image_url">
              <MediaUploadField
                label="Secondary image"
                bucket="about"
                folder="about-secondary"
                mediaType="image"
                onMediaTypeChange={() => undefined}
                value={about.copy_image_url}
                onChange={(copy_image_url) => patchAbout({ copy_image_url })}
              />
            </EditorFieldShell>
            <EditorFieldShell field="image_url">
              <MediaUploadField
                label="Main portrait"
                bucket="about"
                folder="portrait"
                mediaType={(about.media_type as MediaKind) ?? "image"}
                onMediaTypeChange={(media_type) => patchAbout({ media_type })}
                value={about.image_url}
                onChange={(image_url) => patchAbout({ image_url })}
              />
            </EditorFieldShell>
          </EditorFieldCard>
        </div>
      ) : null}
      {tab === "trust" ? (
        <div ref={trustRef}>
          <EditorFieldCard>
            {data.trustItems.map((item) => (
              <div
                key={item.id}
                data-editor-item={item.id}
                className="space-y-2 rounded-md border border-[#ececec] p-3"
              >
                <EditorFieldShell field="value">
                  <BilingualField
                    label="Value"
                    valueEn={item.value}
                    valueAr={item.value_ar ?? ""}
                    onChangeEn={(value) => patchTrustItem(item.id, { value })}
                    onChangeAr={(value_ar) =>
                      patchTrustItem(item.id, { value_ar })
                    }
                    idPrefix={`trust-value-${item.id}`}
                  />
                </EditorFieldShell>
                <EditorFieldShell field="label">
                  <BilingualField
                    label="Label"
                    valueEn={item.label}
                    valueAr={item.label_ar ?? ""}
                    onChangeEn={(label) => patchTrustItem(item.id, { label })}
                    onChangeAr={(label_ar) =>
                      patchTrustItem(item.id, { label_ar })
                    }
                    idPrefix={`trust-label-${item.id}`}
                  />
                </EditorFieldShell>
              </div>
            ))}
          </EditorFieldCard>
        </div>
      ) : null}
    </EditorPanelShell>
  );
}
