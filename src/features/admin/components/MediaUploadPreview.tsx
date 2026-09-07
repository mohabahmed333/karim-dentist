"use client";

import { Card } from "@/components/ui/card";
type MediaKind = "image" | "video";

type Props = {
  value: string;
  mediaType: MediaKind;
};

export function MediaUploadPreview({ value, mediaType }: Props) {
  return (
    <Card className="overflow-hidden p-0 ring-1 ring-border">
      {mediaType === "video" ? (
        <video
          src={value}
          className="aspect-video w-full object-cover"
          controls
          muted
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="aspect-video w-full object-cover" />
      )}
    </Card>
  );
}
