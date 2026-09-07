"use client";

import { ImagesIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { StorageBucket } from "@/lib/supabase/upload";
import { imageFileFromClipboard } from "@/lib/supabase/clipboardImage";
import { useTranslations } from "@/lib/i18n";
import { MediaImagePickerShell } from "./MediaImagePickerShell";
import { MediaUploadPreview } from "./MediaUploadPreview";

type Props = {
  label: string;
  bucket: StorageBucket;
  folder: string;
  value: string | null;
  typeSelect: React.ReactNode;
  onChange: (url: string | null) => void;
  removeLabel?: string;
};

export function MediaImageUploadControls({
  label,
  bucket,
  folder,
  value,
  typeSelect,
  onChange,
  removeLabel,
}: Props) {
  const t = useTranslations();

  return (
    <MediaImagePickerShell
      bucket={bucket}
      folder={folder}
      currentUrl={value}
      onChange={onChange}
    >
      {({ busy, error, skipNote, openLibrary, onDropFile, onPasteImage }) => (
        <div
          className="space-y-2 rounded-md outline-none focus-visible:ring-1 focus-visible:ring-ring"
          tabIndex={0}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!busy) onDropFile(e.dataTransfer.files[0]);
          }}
          onPaste={(e) => {
            if (busy) return;
            const file = imageFileFromClipboard(e.clipboardData);
            if (!file) return;
            e.preventDefault();
            e.stopPropagation();
            onPasteImage(file);
          }}
        >
          <Label className="text-[11px] text-muted-foreground">{label}</Label>
          {typeSelect}
          {value ? <MediaUploadPreview value={value} mediaType="image" /> : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 w-full rounded-[6px] shadow-none"
            disabled={busy}
            onClick={openLibrary}
          >
            <ImagesIcon />
            {busy
              ? t("admin.customize.uploading")
              : value
                ? t("admin.customize.replaceOrChoose")
                : t("admin.customize.chooseImage")}
          </Button>
          {value ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-full rounded-[6px] px-2 text-xs text-muted-foreground"
              disabled={busy}
              onClick={() => onChange(null)}
            >
              {removeLabel ?? t("admin.customize.removeImage")}
            </Button>
          ) : null}
          <p className="text-[11px] text-muted-foreground">
            {value
              ? t("admin.customize.uploaded")
              : t("admin.customize.noImageHint")}
          </p>
          {skipNote ? (
            <p className="text-[11px] text-muted-foreground">
              {t("admin.customize.cropSkipped")}
            </p>
          ) : null}
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      )}
    </MediaImagePickerShell>
  );
}
