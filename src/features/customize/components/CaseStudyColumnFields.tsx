"use client";

import { Button } from "@/components/ui/button";
import {
  MediaUploadField,
  type MediaKind,
} from "@/features/admin/components/MediaUploadField";
import type { ColumnSlot, ColumnsContent } from "@/services/case_study_sections";
import { COLUMN_ASPECT_RATIO_OPTIONS } from "../lib/sectionStyleOptions";
import { BilingualField } from "./BilingualField";
import { ControlledField } from "./ControlledField";
import { SelectField } from "./SelectField";

type Props = {
  content: ColumnsContent;
  onPatch: (partial: Record<string, unknown>) => void;
};

const KINDS: ColumnSlot["kind"][] = ["empty", "text", "media"];

export function CaseStudyColumnFields({ content, onPatch }: Props) {
  const patchSlot = (index: number, partial: Partial<ColumnSlot>) => {
    const slots = content.slots.map((slot, i) =>
      i === index ? { ...slot, ...partial } : slot,
    );
    onPatch({ slots });
  };

  return (
    <div className="space-y-2">
      {content.slots.map((slot, index) => (
        <div key={`col-${index}`} className="space-y-1.5 rounded border p-2">
          <p className="text-[11px] font-medium text-[#6b6b6b]">
            Column {index + 1}
          </p>
          <div className="flex flex-wrap gap-1">
            {KINDS.map((kind) => (
              <Button
                key={kind}
                type="button"
                size="sm"
                variant={slot.kind === kind ? "default" : "outline"}
                className="h-7 rounded-[4px] px-2 text-xs capitalize"
                onClick={() => patchSlot(index, { kind })}
              >
                {kind}
              </Button>
            ))}
          </div>
          {slot.kind === "text" ? (
            <>
              <BilingualField
                label="Heading"
                valueEn={slot.heading ?? ""}
                valueAr={slot.heading_ar ?? ""}
                onChangeEn={(heading) => patchSlot(index, { heading })}
                onChangeAr={(heading_ar) => patchSlot(index, { heading_ar })}
                idPrefix={`col-${index}-heading`}
              />
              <BilingualField
                label="Body"
                valueEn={slot.body}
                valueAr={slot.body_ar ?? ""}
                onChangeEn={(body) => patchSlot(index, { body })}
                onChangeAr={(body_ar) => patchSlot(index, { body_ar })}
                multiline
                idPrefix={`col-${index}-body`}
              />
            </>
          ) : null}
          {slot.kind === "media" ? (
            <>
              <MediaUploadField
                label="Media"
                bucket="projects"
                folder="case-studies"
                mediaType={slot.media_type as MediaKind}
                onMediaTypeChange={(media_type) =>
                  patchSlot(index, { media_type })
                }
                value={slot.media_url}
                onChange={(media_url) => patchSlot(index, { media_url })}
              />
              <ControlledField
                label="Alt text"
                value={slot.alt}
                onChange={(alt) => patchSlot(index, { alt })}
              />
              <SelectField
                label="Aspect ratio"
                value={slot.aspect_ratio}
                options={COLUMN_ASPECT_RATIO_OPTIONS}
                onChange={(aspect_ratio) =>
                  patchSlot(index, {
                    aspect_ratio: aspect_ratio as ColumnSlot["aspect_ratio"],
                  })
                }
              />
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
