"use client";

import { Button } from "@/components/ui/button";
import {
  MediaUploadField,
  type MediaKind,
} from "@/features/admin/components/MediaUploadField";
import type { ParsedCaseStudySection } from "@/services/case_study_sections";
import type { ParsedFeaturedSection } from "@/services/featured_project_sections";
import type {
  ColumnsContent,
  GridContent,
  IntroContent,
  MediaContent,
  SplitContent,
  TextContent,
  TextGridContent,
  TitleContent,
} from "@/services/case_study_sections";
import { useCustomize } from "../context/CustomizeContext";
import {
  ASPECT_RATIO_OPTIONS,
  CROP_POSITION_OPTIONS,
  GRID_COLUMNS_OPTIONS,
  SIDE_OPTIONS,
  SPLIT_MEDIA_ASPECT_OPTIONS,
  SPLIT_RATIO_OPTIONS,
  TEXT_ALIGN_OPTIONS,
  TEXT_WIDTH_OPTIONS,
} from "../lib/sectionStyleOptions";
import { CaseStudyColumnFields } from "./CaseStudyColumnFields";
import { BilingualField } from "./BilingualField";
import { ControlledField } from "./ControlledField";
import { PublishedField } from "./PublishedField";
import { SelectField } from "./SelectField";

type Props = {
  parentId: string;
  section: ParsedCaseStudySection | ParsedFeaturedSection;
  collection: "case-studies" | "featured";
};

export function CaseStudySectionInspector({
  parentId,
  section,
  collection,
}: Props) {
  const {
    patchCaseStudySection,
    duplicateCaseStudySection,
    removeCaseStudySection,
    patchFeaturedSection,
    duplicateFeaturedSection,
    removeFeaturedSection,
  } = useCustomize();

  const patchSection =
    collection === "featured" ? patchFeaturedSection : patchCaseStudySection;
  const duplicateSection =
    collection === "featured"
      ? duplicateFeaturedSection
      : duplicateCaseStudySection;
  const deleteSection =
    collection === "featured" ? removeFeaturedSection : removeCaseStudySection;

  const patchContent = (partial: Record<string, unknown>) => {
    patchSection(parentId, section.id, {
      content: { ...section.content, ...partial } as never,
    });
  };

  return (
    <div className="space-y-2.5 border-t border-[#ececec] pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-[#8a8a8a]">
          Section settings
        </p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 rounded-[4px] px-2 text-xs"
            onClick={() => {
              void duplicateSection(parentId, section.id);
            }}
          >
            Duplicate
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="h-7 rounded-[4px] px-2 text-xs"
            onClick={() => {
              void deleteSection(parentId, section.id);
            }}
          >
            Delete
          </Button>
        </div>
      </div>

      <PublishedField
        label="Visible on page"
        checked={section.is_visible}
        onCheckedChange={(is_visible) =>
          patchSection(parentId, section.id, { is_visible })
        }
      />

      {section.type === "title" ? (
        <TitleFields
          content={section.content as TitleContent}
          onPatch={patchContent}
        />
      ) : null}
      {section.type === "intro" ? (
        <IntroFields
          content={section.content as IntroContent}
          onPatch={patchContent}
        />
      ) : null}
      {section.type === "text" ? (
        <TextFields
          content={section.content as TextContent}
          onPatch={patchContent}
        />
      ) : null}
      {section.type === "media" ? (
        <MediaFields
          content={section.content as MediaContent}
          onPatch={patchContent}
        />
      ) : null}
      {section.type === "split" ? (
        <SplitFields
          content={section.content as SplitContent}
          onPatch={patchContent}
        />
      ) : null}
      {section.type === "text_grid" ? (
        <TextGridFields
          content={section.content as TextGridContent}
          onPatch={patchContent}
        />
      ) : null}
      {section.type === "grid" ? (
        <GridFields
          content={section.content as GridContent}
          onPatch={patchContent}
        />
      ) : null}
      {section.type === "columns" ? (
        <CaseStudyColumnFields
          content={section.content as ColumnsContent}
          onPatch={patchContent}
        />
      ) : null}
    </div>
  );
}

function TitleFields({
  content,
  onPatch,
}: {
  content: TitleContent;
  onPatch: (partial: Record<string, unknown>) => void;
}) {
  return (
    <>
      <BilingualField
        label="Eyebrow"
        valueEn={content.eyebrow ?? ""}
        valueAr={content.eyebrow_ar ?? ""}
        onChangeEn={(eyebrow) => onPatch({ eyebrow })}
        onChangeAr={(eyebrow_ar) => onPatch({ eyebrow_ar })}
        idPrefix={`sec-eyebrow-${content.title}`}
      />
      <BilingualField
        label="Title"
        valueEn={content.title}
        valueAr={content.title_ar ?? ""}
        onChangeEn={(title) => onPatch({ title })}
        onChangeAr={(title_ar) => onPatch({ title_ar })}
        idPrefix={`sec-title-${content.title}`}
      />
    </>
  );
}

function IntroFields({
  content,
  onPatch,
}: {
  content: IntroContent;
  onPatch: (partial: Record<string, unknown>) => void;
}) {
  return (
    <>
      <BilingualField
        label="Label"
        valueEn={content.label}
        valueAr={content.label_ar ?? ""}
        onChangeEn={(label) => onPatch({ label })}
        onChangeAr={(label_ar) => onPatch({ label_ar })}
      />
      <BilingualField
        label="Body"
        valueEn={content.body}
        valueAr={content.body_ar ?? ""}
        onChangeEn={(body) => onPatch({ body })}
        onChangeAr={(body_ar) => onPatch({ body_ar })}
        multiline
      />
    </>
  );
}

function TextFields({
  content,
  onPatch,
}: {
  content: TextContent;
  onPatch: (partial: Record<string, unknown>) => void;
}) {
  return (
    <>
      <BilingualField
        label="Heading"
        valueEn={content.heading ?? ""}
        valueAr={content.heading_ar ?? ""}
        onChangeEn={(heading) => onPatch({ heading })}
        onChangeAr={(heading_ar) => onPatch({ heading_ar })}
      />
      <BilingualField
        label="Body"
        valueEn={content.body}
        valueAr={content.body_ar ?? ""}
        onChangeEn={(body) => onPatch({ body })}
        onChangeAr={(body_ar) => onPatch({ body_ar })}
        multiline
      />
      <SelectField
        label="Width"
        value={content.width}
        options={TEXT_WIDTH_OPTIONS}
        onChange={(width) => onPatch({ width })}
      />
      <SelectField
        label="Align"
        value={content.align}
        options={TEXT_ALIGN_OPTIONS}
        onChange={(align) => onPatch({ align })}
      />
    </>
  );
}

function MediaFields({
  content,
  onPatch,
}: {
  content: MediaContent;
  onPatch: (partial: Record<string, unknown>) => void;
}) {
  return (
    <>
      <MediaUploadField
        label="Media"
        bucket="projects"
        folder="case-studies"
        mediaType={content.media_type as MediaKind}
        onMediaTypeChange={(media_type) => onPatch({ media_type })}
        value={content.media_url}
        onChange={(media_url) => onPatch({ media_url })}
      />
      <ControlledField
        label="Alt text"
        value={content.alt}
        onChange={(alt) => onPatch({ alt })}
      />
      <BilingualField
        label="Caption"
        valueEn={content.caption}
        valueAr={content.caption_ar ?? ""}
        onChangeEn={(caption) => onPatch({ caption })}
        onChangeAr={(caption_ar) => onPatch({ caption_ar })}
      />
      <SelectField
        label="Aspect ratio"
        value={content.aspect_ratio}
        options={ASPECT_RATIO_OPTIONS}
        onChange={(aspect_ratio) => onPatch({ aspect_ratio })}
      />
      <SelectField
        label="Crop position"
        value={content.object_position}
        options={CROP_POSITION_OPTIONS}
        onChange={(object_position) => onPatch({ object_position })}
      />
    </>
  );
}

function SplitFields({
  content,
  onPatch,
}: {
  content: SplitContent;
  onPatch: (partial: Record<string, unknown>) => void;
}) {
  return (
    <>
      <BilingualField
        label="Heading"
        valueEn={content.heading ?? ""}
        valueAr={content.heading_ar ?? ""}
        onChangeEn={(heading) => onPatch({ heading })}
        onChangeAr={(heading_ar) => onPatch({ heading_ar })}
      />
      <BilingualField
        label="Body"
        valueEn={content.body}
        valueAr={content.body_ar ?? ""}
        onChangeEn={(body) => onPatch({ body })}
        onChangeAr={(body_ar) => onPatch({ body_ar })}
        multiline
      />
      <MediaUploadField
        label="Media"
        bucket="projects"
        folder="case-studies"
        mediaType={content.media_type as MediaKind}
        onMediaTypeChange={(media_type) => onPatch({ media_type })}
        value={content.media_url}
        onChange={(media_url) => onPatch({ media_url })}
      />
      <ControlledField
        label="Alt text"
        value={content.alt}
        onChange={(alt) => onPatch({ alt })}
      />
      <SelectField
        label="Media position"
        value={content.media_position}
        options={SIDE_OPTIONS}
        onChange={(media_position) => onPatch({ media_position })}
      />
      <SelectField
        label="Column ratio"
        value={content.ratio}
        options={SPLIT_RATIO_OPTIONS}
        onChange={(ratio) => onPatch({ ratio })}
      />
      <SelectField
        label="Media aspect"
        value={content.media_aspect ?? "16/9"}
        options={SPLIT_MEDIA_ASPECT_OPTIONS}
        onChange={(media_aspect) => onPatch({ media_aspect })}
      />
    </>
  );
}

function TextGridFields({
  content,
  onPatch,
}: {
  content: TextGridContent;
  onPatch: (partial: Record<string, unknown>) => void;
}) {
  return (
    <>
      <BilingualField
        label="Heading"
        valueEn={content.heading ?? ""}
        valueAr={content.heading_ar ?? ""}
        onChangeEn={(heading) => onPatch({ heading })}
        onChangeAr={(heading_ar) => onPatch({ heading_ar })}
      />
      <BilingualField
        label="Body"
        valueEn={content.body}
        valueAr={content.body_ar ?? ""}
        onChangeEn={(body) => onPatch({ body })}
        onChangeAr={(body_ar) => onPatch({ body_ar })}
        multiline
      />
      <SelectField
        label="Text position"
        value={content.text_position}
        options={SIDE_OPTIONS}
        onChange={(text_position) => onPatch({ text_position })}
      />
      {content.items.map((item, index) => (
        <div key={`tg-item-${index}`} className="space-y-1.5 rounded border p-2">
          <p className="text-[11px] font-medium text-[#6b6b6b]">
            Grid image {index + 1}
          </p>
          <MediaUploadField
            label="Media"
            bucket="projects"
            folder="case-studies"
            mediaType={item.media_type as MediaKind}
            onMediaTypeChange={(media_type) => {
              const items = content.items.map((entry, i) =>
                i === index ? { ...entry, media_type } : entry,
              );
              onPatch({ items });
            }}
            value={item.media_url}
            onChange={(media_url) => {
              const items = content.items.map((entry, i) =>
                i === index ? { ...entry, media_url } : entry,
              );
              onPatch({ items });
            }}
          />
          <ControlledField
            label="Alt text"
            value={item.alt}
            onChange={(alt) => {
              const items = content.items.map((entry, i) =>
                i === index ? { ...entry, alt } : entry,
              );
              onPatch({ items });
            }}
          />
        </div>
      ))}
    </>
  );
}

function GridFields({
  content,
  onPatch,
}: {
  content: GridContent;
  onPatch: (partial: Record<string, unknown>) => void;
}) {
  return (
    <>
      <SelectField
        label="Columns"
        value={String(content.columns)}
        options={GRID_COLUMNS_OPTIONS}
        onChange={(raw) => onPatch({ columns: Number(raw) as 2 | 3 | 4 })}
      />
      {content.items.map((item, index) => (
        <div key={`grid-item-${index}`} className="space-y-1.5 rounded border p-2">
          <p className="text-[11px] font-medium text-[#6b6b6b]">
            Item {index + 1}
          </p>
          <MediaUploadField
            label="Media"
            bucket="projects"
            folder="case-studies"
            mediaType={item.media_type as MediaKind}
            onMediaTypeChange={(media_type) => {
              const items = content.items.map((entry, i) =>
                i === index ? { ...entry, media_type } : entry,
              );
              onPatch({ items });
            }}
            value={item.media_url}
            onChange={(media_url) => {
              const items = content.items.map((entry, i) =>
                i === index ? { ...entry, media_url } : entry,
              );
              onPatch({ items });
            }}
          />
          <ControlledField
            label="Alt text"
            value={item.alt}
            onChange={(alt) => {
              const items = content.items.map((entry, i) =>
                i === index ? { ...entry, alt } : entry,
              );
              onPatch({ items });
            }}
          />
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 rounded-[4px] text-xs"
        disabled={content.items.length >= 4}
        onClick={() => {
          onPatch({
            items: [
              ...content.items,
              { media_url: null, media_type: "image", alt: "" },
            ],
          });
        }}
      >
        + Add grid item
      </Button>
    </>
  );
}
