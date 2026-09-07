"use client";

import { Trash2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { uploadPublicMedia } from "@/lib/supabase/upload";
import {
  IMAGE_FILE_ACCEPT,
  VIDEO_FILE_ACCEPT,
  prepareMediaFile,
} from "@/lib/supabase/uploadHelpers";
import type { MediaFile } from "./canvas.types";

const SLOTS = [0, 1, 2, 3] as const;

type Props = {
  value: MediaFile[];
  onChange: (files: MediaFile[]) => void;
};

function SlotUpload({
  file,
  index,
  onUpload,
  onRemove,
}: {
  file?: MediaFile;
  index: number;
  onUpload: (index: number, file: MediaFile) => void;
  onRemove: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const label = `Slot ${index + 1}`;

  async function handleFile(raw: File | undefined) {
    if (!raw) return;
    const kind: "image" | "video" = raw.type.startsWith("video/") ? "video" : "image";
    setBusy(true);
    setErr(null);
    try {
      const prepared = prepareMediaFile(raw, kind);
      const url = await uploadPublicMedia("patient-records", prepared, "canvas-media");
      onUpload(index, { url, kind });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="file"
        accept={`${IMAGE_FILE_ACCEPT},${VIDEO_FILE_ACCEPT}`}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />

      <button
        type="button"
        className="group relative flex aspect-square w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-[#EBEAE5] text-[#111111]/50 transition hover:bg-[#E2F163]/20"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        {file ? (
          file.kind === "video" ? (
            <video
              src={file.url}
              className="h-full w-full object-cover"
              muted
              playsInline
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={file.url} alt={label} className="h-full w-full object-cover" />
          )
        ) : (
          <span className="flex flex-col items-center gap-1">
            <UploadCloud className="size-5" />
            <span className="text-[9px] font-medium">{busy ? "Uploading…" : label}</span>
          </span>
        )}

        {file && !busy ? (
          <button
            type="button"
            aria-label={`Remove ${label}`}
            className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
          >
            <Trash2 className="size-3" />
          </button>
        ) : null}
      </button>

      {err ? (
        <p className="mt-0.5 text-[9px] text-red-500">{err}</p>
      ) : null}
    </div>
  );
}

export function MediaGridUploadFields({ value, onChange }: Props) {
  function handleUpload(index: number, file: MediaFile) {
    const next = [...value];
    next[index] = file;
    onChange(next);
  }

  function handleRemove(index: number) {
    const next = [...value];
    next.splice(index, 1, undefined as unknown as MediaFile);
    // collapse undefineds
    onChange(next.filter(Boolean));
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[#111111]/55">
        Upload up to 4 images or videos (drop or click each slot).
      </p>
      <div className="grid grid-cols-2 gap-2">
        {SLOTS.map((i) => (
          <SlotUpload
            key={i}
            index={i}
            file={value[i]}
            onUpload={handleUpload}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
