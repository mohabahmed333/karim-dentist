"use client";

import { useRef, useState } from "react";
import {
  IMAGE_FILE_ACCEPT,
  VIDEO_FILE_ACCEPT,
  prepareMediaFile,
} from "@/lib/supabase/uploadHelpers";
import { uploadPublicMedia, type StorageBucket } from "@/lib/supabase/upload";

export type MediaKind = "image" | "video";

export function useMediaUpload(
  bucket: StorageBucket,
  folder: string,
  mediaType: MediaKind,
  onChange: (url: string | null) => void,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accept =
    mediaType === "video" ? VIDEO_FILE_ACCEPT : IMAGE_FILE_ACCEPT;

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const prepared = prepareMediaFile(file, mediaType);
      onChange(await uploadPublicMedia(bucket, prepared, folder));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return {
    inputRef,
    busy,
    error,
    accept,
    onFile,
    onPick: () => inputRef.current?.click(),
    drop: {
      onDragOver: (event: React.DragEvent) => event.preventDefault(),
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        if (!busy) void onFile(event.dataTransfer.files[0]);
      },
    },
  };
}
