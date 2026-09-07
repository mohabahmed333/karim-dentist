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
import { SelectField } from "./SelectField";

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

function tagsToText(tags: unknown) {
  if (Array.isArray(tags)) return tags.map(String).join("\n");
  return String(tags ?? "");
}

function textToTags(value: string) {
  return value
    .split(/\n|,/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function ServiceItemFields({ item, onPatch, focusField }: Props) {
  const [tab, setTab] = useState<Tab>(() => tabFromFocus(focusField));

  useEffect(() => {
    setTab(tabFromFocus(focusField));
  }, [focusField]);

  return (
    <div className="space-y-2.5">
      <EditorSegmentTabs
        ariaLabel="Service details"
        value={tab}
        options={[
          { id: "content", label: "Content" },
          { id: "media", label: "Media" },
        ]}
        onChange={setTab}
      />
      {tab === "content" ? (
        <div className="space-y-2">
          <SelectField
            label="Group"
            value={
              item.kind === "laser" ? "laser" : "our_services"
            }
            options={[
              { value: "our_services", label: "Our Services" },
              { value: "laser", label: "Laser treatments" },
            ]}
            onChange={(kind) => onPatch({ kind })}
          />
          <EditorFieldShell field="title">
            <BilingualField
              label="Title"
              valueEn={String(item.title ?? "")}
              valueAr={String(item.title_ar ?? "")}
              onChangeEn={(title) => onPatch({ title })}
              onChangeAr={(title_ar) => onPatch({ title_ar })}
              idPrefix={`service-title-${item.id}`}
            />
          </EditorFieldShell>
          <ControlledField
            label="Tags (one per line)"
            value={tagsToText(item.tags)}
            onChange={(value) => onPatch({ tags: textToTags(value) })}
            multiline
          />
          <EditorFieldShell field="description">
            <BilingualField
              label="Description"
              valueEn={String(item.description ?? "")}
              valueAr={String(item.description_ar ?? "")}
              onChangeEn={(description) => onPatch({ description })}
              onChangeAr={(description_ar) => onPatch({ description_ar })}
              multiline
              idPrefix={`service-desc-${item.id}`}
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
          folder="services"
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
