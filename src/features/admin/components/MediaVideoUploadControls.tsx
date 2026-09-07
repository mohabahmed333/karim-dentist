"use client";

import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { StorageBucket } from "@/lib/supabase/upload";
import { useTranslations } from "@/lib/i18n";
import { MediaUploadPreview } from "./MediaUploadPreview";
import { useMediaUpload, type MediaKind } from "./useMediaUpload";

type Props = {
  label: string;
  bucket: StorageBucket;
  folder: string;
  value: string | null;
  mediaType: MediaKind;
  typeSelect: React.ReactNode;
  onChange: (url: string | null) => void;
  removeLabel?: string;
};

export function MediaVideoUploadControls({
  label,
  bucket,
  folder,
  value,
  mediaType,
  typeSelect,
  onChange,
  removeLabel,
}: Props) {
  const t = useTranslations();
  const video = useMediaUpload(bucket, folder, mediaType, onChange);

  return (
    <div className="space-y-2" {...video.drop}>
      <Label className="text-[11px] text-muted-foreground">{label}</Label>
      {typeSelect}
      {value ? <MediaUploadPreview value={value} mediaType="video" /> : null}
      <input
        ref={video.inputRef}
        type="file"
        accept={video.accept}
        disabled={video.busy}
        className="hidden"
        onChange={(e) => {
          void video.onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-full rounded-[6px] shadow-none"
        disabled={video.busy}
        onClick={video.onPick}
      >
        <UploadIcon />
        {video.busy
          ? t("admin.customize.uploading")
          : value
            ? t("admin.customize.replaceFile")
            : t("admin.customize.uploadFile")}
      </Button>
      {value ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 w-full rounded-[6px] px-2 text-xs text-muted-foreground"
          disabled={video.busy}
          onClick={() => onChange(null)}
        >
          {removeLabel ?? t("admin.customize.removeVideo")}
        </Button>
      ) : null}
      <p className="text-[11px] text-muted-foreground">
        {value ? t("admin.customize.uploaded") : t("admin.customize.noFile")}
      </p>
      {video.error ? (
        <p className="text-xs text-destructive">{video.error}</p>
      ) : null}
    </div>
  );
}
