"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StorageBucket } from "@/lib/supabase/upload";
import { useTranslations } from "@/lib/i18n";
import { MediaImageUploadControls } from "./MediaImageUploadControls";
import { MediaVideoUploadControls } from "./MediaVideoUploadControls";
import type { MediaKind } from "./useMediaUpload";

export type { MediaKind };

type Props = {
  label: string;
  bucket: StorageBucket;
  value: string | null;
  mediaType: MediaKind;
  onChange: (url: string | null) => void;
  onMediaTypeChange: (type: MediaKind) => void;
  folder?: string;
  removeLabel?: string;
};

export function MediaUploadField({
  label,
  bucket,
  value,
  mediaType,
  onChange,
  onMediaTypeChange,
  folder = "uploads",
  removeLabel,
}: Props) {
  const t = useTranslations();
  const typeSelect = (
    <Select
      value={mediaType}
      onValueChange={(next) => onMediaTypeChange(next as MediaKind)}
    >
      <SelectTrigger className="h-8 w-full rounded-[6px] shadow-none">
        <SelectValue placeholder={t("admin.customize.mediaType")} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="image">{t("admin.customize.image")}</SelectItem>
        <SelectItem value="video">{t("admin.customize.video")}</SelectItem>
      </SelectContent>
    </Select>
  );

  if (mediaType === "image") {
    return (
      <MediaImageUploadControls
        label={label}
        bucket={bucket}
        folder={folder}
        value={value}
        typeSelect={typeSelect}
        onChange={onChange}
        removeLabel={removeLabel}
      />
    );
  }

  return (
    <MediaVideoUploadControls
      label={label}
      bucket={bucket}
      folder={folder}
      value={value}
      mediaType={mediaType}
      typeSelect={typeSelect}
      onChange={onChange}
      removeLabel={removeLabel}
    />
  );
}
