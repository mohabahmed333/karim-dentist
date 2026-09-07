"use client";

import { CASE_STUDY_FIELD_LABELS } from "../lib/caseStudyFields";
import { BilingualField } from "./BilingualField";
import { ControlledField } from "./ControlledField";
import { EditorFieldShell } from "./EditorFieldShell";
import { PublishedField } from "./PublishedField";
import { YearField } from "./YearField";

type Props = {
  item: Record<string, unknown>;
  onPatch: (partial: Record<string, unknown>) => void;
};

export function CaseStudyContentFields({ item, onPatch }: Props) {
  const tagsValue = Array.isArray(item.tags)
    ? item.tags.map(String).join(", ")
    : "";
  const id = String(item.id ?? "new");

  return (
    <div className="space-y-2">
      <EditorFieldShell field="title">
        <BilingualField
          label={CASE_STUDY_FIELD_LABELS.title}
          valueEn={String(item.title ?? "")}
          valueAr={String(item.title_ar ?? "")}
          onChangeEn={(title) => onPatch({ title })}
          onChangeAr={(title_ar) => onPatch({ title_ar })}
          idPrefix={`cs-title-${id}`}
        />
      </EditorFieldShell>
      <EditorFieldShell field="slug">
        <ControlledField
          label="URL slug"
          value={String(item.slug ?? "")}
          onChange={(slug) => onPatch({ slug: slug || null })}
        />
      </EditorFieldShell>
      <EditorFieldShell field="description">
        <BilingualField
          label={CASE_STUDY_FIELD_LABELS.description}
          valueEn={String(item.description ?? "")}
          valueAr={String(item.description_ar ?? "")}
          onChangeEn={(description) => onPatch({ description })}
          onChangeAr={(description_ar) => onPatch({ description_ar })}
          multiline
          idPrefix={`cs-desc-${id}`}
        />
      </EditorFieldShell>
      <div className="grid grid-cols-2 gap-2">
        <EditorFieldShell field="year">
          <YearField
            value={String(item.year ?? "")}
            onChange={(year) => onPatch({ year: year || null })}
          />
        </EditorFieldShell>
        <EditorFieldShell field="category">
          <ControlledField
            label={CASE_STUDY_FIELD_LABELS.category}
            value={String(item.category ?? "")}
            onChange={(category) => onPatch({ category: category || null })}
          />
        </EditorFieldShell>
      </div>
      <EditorFieldShell field="tags">
        <ControlledField
          label={`${CASE_STUDY_FIELD_LABELS.tags} (comma-separated)`}
          value={tagsValue}
          onChange={(raw) =>
            onPatch({
              tags: raw
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
            })
          }
        />
      </EditorFieldShell>
      <EditorFieldShell field="is_published">
        <PublishedField
          label={CASE_STUDY_FIELD_LABELS.is_published}
          checked={Boolean(item.is_published)}
          onCheckedChange={(is_published) => onPatch({ is_published })}
        />
      </EditorFieldShell>
    </div>
  );
}
