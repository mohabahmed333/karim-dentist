"use client";

import { useRef } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";
import { IMAGE_FILE_ACCEPT } from "@/lib/supabase/uploadHelpers";

type Props = {
  busy?: boolean;
  onPickFile: (file: File) => void;
};

export function MediaLibraryUploadPane({ busy = false, onPickFile }: Props) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed border-border py-12"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (file) onPickFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_FILE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onPickFile(file);
        }}
      />
      <p className="text-sm text-muted-foreground">
        {t("admin.customize.mediaUploadHint")}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <UploadIcon className="size-3.5" />
        {t("admin.customize.uploadFile")}
      </Button>
    </div>
  );
}
