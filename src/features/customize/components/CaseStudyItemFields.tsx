"use client";

import { useEffect, useState } from "react";
import {
  MediaUploadField,
  type MediaKind,
} from "@/features/admin/components/MediaUploadField";
import { CASE_STUDY_FIELD_LABELS } from "../lib/caseStudyFields";
import { CaseStudyContentFields } from "./CaseStudyContentFields";
import { CaseStudyCreditFields } from "./CaseStudyCreditFields";
import { EditorFieldShell } from "./EditorFieldShell";
import { EditorSegmentTabs } from "./EditorSegmentTabs";
import { useFocusEditorField } from "./useFocusEditorField";

type Tab = "content" | "credits" | "media";

type Props = {
  item: Record<string, unknown> & { id: string };
  onPatch: (partial: Record<string, unknown>) => void;
  focusField?: string | null;
};

const CREDIT_FIELDS = new Set([
  "client",
  "director",
  "agency",
  "production_company",
]);

function tabFromFocus(focusField?: string | null): Tab {
  if (!focusField) return "content";
  if (focusField === "media_url" || focusField === "media_type") return "media";
  if (CREDIT_FIELDS.has(focusField)) return "credits";
  return "content";
}

export function CaseStudyItemFields({ item, onPatch, focusField }: Props) {
  const rootRef = useFocusEditorField(focusField, item.id);
  const [tab, setTab] = useState<Tab>(() => tabFromFocus(focusField));

  useEffect(() => {
    setTab(tabFromFocus(focusField));
  }, [focusField]);

  return (
    <div ref={rootRef} className="space-y-2.5">
      <EditorSegmentTabs
        ariaLabel="Case study details"
        value={tab}
        options={[
          { id: "content", label: "Content" },
          { id: "credits", label: "Credits" },
          { id: "media", label: "Media" },
        ]}
        onChange={setTab}
      />
      {tab === "content" ? (
        <CaseStudyContentFields item={item} onPatch={onPatch} />
      ) : null}
      {tab === "credits" ? (
        <div className="space-y-2">
          <CaseStudyCreditFields item={item} onPatch={onPatch} />
        </div>
      ) : null}
      {tab === "media" ? (
        <EditorFieldShell field="media_url">
          <MediaUploadField
            label={CASE_STUDY_FIELD_LABELS.media_url}
            bucket="projects"
            folder="case-studies"
            mediaType={(item.media_type as MediaKind) ?? "image"}
            onMediaTypeChange={(media_type) => onPatch({ media_type })}
            value={(item.media_url as string | null) ?? null}
            onChange={(media_url) => onPatch({ media_url })}
          />
        </EditorFieldShell>
      ) : null}
    </div>
  );
}
