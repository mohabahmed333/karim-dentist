"use client";

import { MediaUploadField } from "@/features/admin/components/MediaUploadField";
import { Button } from "@/components/ui/button";
import { useCustomize } from "../context/CustomizeContext";
import { useCustomizeRoute } from "../context/CustomizeRouteContext";
import { ControlledField } from "./ControlledField";
import { EditorFieldCard, EditorSectionHeader } from "./EditorSectionChrome";
import { EditorFieldShell } from "./EditorFieldShell";
import { EditorOpenPageLink } from "./EditorOpenPageLink";
import { EditorPanelShell } from "./EditorPanelShell";
import { useFocusEditorField } from "./useFocusEditorField";

type Props = {
  id: string;
  focusField?: string | null;
};

export function GalleryComparisonItemPanel({ id, focusField }: Props) {
  const { data, patchGalleryComparison, removeGalleryComparison } =
    useCustomize();
  const { navigate } = useCustomizeRoute();
  const item = data.galleryComparisons.find((row) => row.id === id);
  const rootRef = useFocusEditorField(focusField, id);

  if (!item) {
    return <p className="text-sm text-[#8a8a8a]">Comparison not found.</p>;
  }

  return (
    <EditorPanelShell>
      <div ref={rootRef} className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 rounded-[6px] px-2 text-xs"
            onClick={() => navigate({ section: "gallery" })}
          >
            ← List
          </Button>
          <div className="flex items-center gap-2">
            <EditorOpenPageLink href="/#gallery" />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-7 rounded-[6px] px-2 text-xs"
              onClick={() => {
                void removeGalleryComparison(id).then(() =>
                  navigate({ section: "gallery" }),
                );
              }}
            >
              Delete
            </Button>
          </div>
        </div>
        <EditorSectionHeader title="Comparison details" />
        <EditorFieldCard>
          <EditorFieldShell field="before_image_url">
            <MediaUploadField
              label="Before image"
              bucket="about"
              folder="gallery"
              mediaType="image"
              onMediaTypeChange={() => undefined}
              value={item.before_image_url || null}
              onChange={(before_image_url) =>
                patchGalleryComparison(id, {
                  before_image_url: before_image_url ?? "",
                })
              }
            />
          </EditorFieldShell>
          <EditorFieldShell field="after_image_url">
            <MediaUploadField
              label="After image"
              bucket="about"
              folder="gallery"
              mediaType="image"
              onMediaTypeChange={() => undefined}
              value={item.after_image_url || null}
              onChange={(after_image_url) =>
                patchGalleryComparison(id, {
                  after_image_url: after_image_url ?? "",
                })
              }
            />
          </EditorFieldShell>
          <ControlledField
            label="Alt text"
            value={item.alt_text}
            onChange={(alt_text) => patchGalleryComparison(id, { alt_text })}
          />
        </EditorFieldCard>
      </div>
    </EditorPanelShell>
  );
}
