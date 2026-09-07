"use client";

import { useCallback } from "react";
import type { StorageBucket } from "@/lib/supabase/upload";
import { ImageCropDialog } from "./ImageCropDialog";
import { MediaLibraryDialog } from "./MediaLibraryDialog";
import { useImageMediaPicker } from "./useImageMediaPicker";
import { usePasteImage } from "./usePasteImage";

type Props = {
  bucket: StorageBucket;
  folder: string;
  currentUrl?: string | null;
  onChange: (url: string | null) => void;
  children: (api: {
    busy: boolean;
    error: string | null;
    skipNote: boolean;
    openLibrary: () => void;
    onDropFile: (file: File | undefined) => void;
    onPasteImage: (file: File) => void;
  }) => React.ReactNode;
};

export function MediaImagePickerShell({
  bucket,
  folder,
  currentUrl = null,
  onChange,
  children,
}: Props) {
  const image = useImageMediaPicker({ bucket, folder, onChange });

  const onPasteImage = useCallback(
    (file: File) => {
      void image.handlePickFile(file);
    },
    [image.handlePickFile],
  );

  usePasteImage({
    enabled: image.libraryOpen && !image.cropFile,
    busy: image.busy,
    onImage: onPasteImage,
  });

  return (
    <>
      {children({
        busy: image.busy,
        error: image.error,
        skipNote: image.skipNote,
        openLibrary: image.openLibrary,
        onDropFile: (file) => {
          if (file) void image.handlePickFile(file);
        },
        onPasteImage,
      })}
      <MediaLibraryDialog
        open={image.libraryOpen}
        busy={image.busy}
        currentUrl={currentUrl}
        defaultBucket={bucket}
        onOpenChange={image.setLibraryOpen}
        onSelectExisting={image.selectExisting}
        onPickFile={(file) => void image.handlePickFile(file)}
      />
      <ImageCropDialog
        open={Boolean(image.cropFile)}
        file={image.cropFile}
        busy={image.busy}
        onOpenChange={(open) => {
          if (!open) image.setCropFile(null);
        }}
        onCropped={(file) => void image.uploadCropped(file)}
      />
    </>
  );
}
