"use client";

import { MediaUploadField } from "./MediaUploadField";

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
};

export function FooterTaglineImageField({ value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <MediaUploadField
        label="Left keyword image (optional)"
        bucket="hero"
        folder="footer"
        mediaType="image"
        onMediaTypeChange={() => undefined}
        value={value}
        onChange={onChange}
        removeLabel="Remove keyword image (use text)"
      />
      <p className="text-[11px] text-muted-foreground">
        Replaces the large footer script when uploaded. Tagline text stays as
        fallback and alt text.
      </p>
    </div>
  );
}
