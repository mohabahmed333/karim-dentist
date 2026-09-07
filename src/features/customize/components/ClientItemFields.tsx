"use client";

import {
  MediaUploadField,
  type MediaKind,
} from "@/features/admin/components/MediaUploadField";
import { ControlledField } from "./ControlledField";

type Props = {
  item: Record<string, unknown> & { id: string };
  onPatch: (partial: Record<string, unknown>) => void;
};

export function ClientItemFields({ item, onPatch }: Props) {
  return (
    <div className="space-y-2">
      <ControlledField
        label="Name (text fallback)"
        value={String(item.name ?? "")}
        onChange={(name) => onPatch({ name })}
      />
      <MediaUploadField
        label="Logo image"
        bucket="clients"
        folder="logos"
        mediaType={(item.media_type as MediaKind) ?? "image"}
        onMediaTypeChange={(media_type) => onPatch({ media_type })}
        value={(item.logo_url as string | null) ?? null}
        onChange={(logo_url) => onPatch({ logo_url })}
      />
      <p className="text-[11px] leading-relaxed text-[#8a8a8a]">
        Logo shows when uploaded. Name is used as the fallback label.
      </p>
    </div>
  );
}
