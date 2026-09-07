"use client";

import { MediaUploadField } from "./MediaUploadField";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function CalloutLeadImageField({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <MediaUploadField
        label="Big script image (optional)"
        bucket="hero"
        folder="callout"
        mediaType="image"
        onMediaTypeChange={() => undefined}
        value={value}
        onChange={onChange}
        removeLabel="Remove script image (use text)"
      />
      <p className="text-[11px] text-muted-foreground">
        Replaces the large script text when uploaded. Lead copy stays as fallback
        and alt text.
      </p>
    </div>
  );
}
