"use client";

import { useCallback, useState } from "react";
import { prepareMediaFile } from "@/lib/supabase/uploadHelpers";
import { shouldCropImage } from "@/lib/supabase/cropImage";
import { uploadPublicMedia, type StorageBucket } from "@/lib/supabase/upload";

type Options = {
  bucket: StorageBucket;
  folder: string;
  onChange: (url: string | null) => void;
};

export function useImageMediaPicker({ bucket, folder, onChange }: Options) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipNote, setSkipNote] = useState(false);

  const uploadPrepared = useCallback(
    async (file: File) => {
      setBusy(true);
      setError(null);
      try {
        const prepared = prepareMediaFile(file, "image");
        onChange(await uploadPublicMedia(bucket, prepared, folder));
        setLibraryOpen(false);
        setCropFile(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setBusy(false);
      }
    },
    [bucket, folder, onChange],
  );

  const handlePickFile = useCallback(
    async (file: File) => {
      setError(null);
      setSkipNote(false);
      try {
        const prepared = prepareMediaFile(file, "image");
        if (shouldCropImage(prepared)) {
          setLibraryOpen(false);
          setCropFile(prepared);
          return;
        }
        await uploadPrepared(prepared);
        setSkipNote(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [uploadPrepared],
  );

  const selectExisting = useCallback(
    (url: string) => {
      onChange(url);
      setLibraryOpen(false);
      setError(null);
      setSkipNote(false);
    },
    [onChange],
  );

  return {
    libraryOpen,
    setLibraryOpen,
    cropFile,
    setCropFile,
    busy,
    error,
    skipNote,
    handlePickFile,
    selectExisting,
    uploadCropped: uploadPrepared,
    openLibrary: () => {
      setSkipNote(false);
      setLibraryOpen(true);
    },
  };
}
