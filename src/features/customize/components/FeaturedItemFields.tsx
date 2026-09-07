"use client";

import { useEffect, useState } from "react";
import {
  MediaUploadField,
  type MediaKind,
} from "@/features/admin/components/MediaUploadField";
import { BilingualField } from "./BilingualField";
import { ControlledField } from "./ControlledField";
import { EditorFieldShell } from "./EditorFieldShell";
import { EditorSegmentTabs } from "./EditorSegmentTabs";
import { PublishedField } from "./PublishedField";

type Tab = "content" | "media";

type Props = {
  item: Record<string, unknown> & { id: string };
  onPatch: (partial: Record<string, unknown>) => void;
  focusField?: string | null;
};

function tabFromFocus(focusField?: string | null): Tab {
  if (focusField === "image_url" || focusField === "media_type") return "media";
  return "content";
}

export function FeaturedItemFields({ item, onPatch, focusField }: Props) {
  const [tab, setTab] = useState<Tab>(() => tabFromFocus(focusField));

  useEffect(() => {
    setTab(tabFromFocus(focusField));
  }, [focusField]);

  return (
    <div className="space-y-2.5">
      <EditorSegmentTabs
        ariaLabel="Featured project details"
        value={tab}
        options={[
          { id: "content", label: "Content" },
          { id: "media", label: "Media" },
        ]}
        onChange={setTab}
      />
      {tab === "content" ? (
        <div className="space-y-2">
          <EditorFieldShell field="title">
            <BilingualField
              label="Title"
              valueEn={String(item.title ?? "")}
              valueAr={String(item.title_ar ?? "")}
              onChangeEn={(title) => onPatch({ title })}
              onChangeAr={(title_ar) => onPatch({ title_ar })}
              idPrefix={`fp-title-${item.id}`}
            />
          </EditorFieldShell>
          <ControlledField
            label="URL slug"
            value={String(item.slug ?? "")}
            onChange={(slug) => onPatch({ slug: slug || null })}
          />
          <EditorFieldShell field="eyebrow">
            <BilingualField
              label="Eyebrow"
              valueEn={String(item.eyebrow ?? "")}
              valueAr={String(item.eyebrow_ar ?? "")}
              onChangeEn={(eyebrow) => onPatch({ eyebrow })}
              onChangeAr={(eyebrow_ar) => onPatch({ eyebrow_ar })}
              idPrefix={`fp-eyebrow-${item.id}`}
            />
          </EditorFieldShell>
          <PublishedField
            label="Published"
            checked={Boolean(item.is_published)}
            onCheckedChange={(is_published) => onPatch({ is_published })}
          />
        </div>
      ) : (
        <EditorFieldShell field="image_url">
          <MediaUploadField
          label="Image"
          bucket="projects"
          folder="featured"
          mediaType={(item.media_type as MediaKind) ?? "image"}
          onMediaTypeChange={(media_type) => onPatch({ media_type })}
          value={(item.image_url as string | null) ?? null}
          onChange={(image_url) => onPatch({ image_url })}
        />
        </EditorFieldShell>
      )}
    </div>
  );
}
