"use client";

import { useRef, useState } from "react";
import { FileText, ImageIcon, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslations } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import {
  QUICK_REPLY_BUCKET,
  QUICK_REPLY_MAX_FILE_BYTES,
  type CannedReplyAttachment,
} from "@/services/whatsapp/cannedReplyInput";

const ACCEPTED = {
  "image/jpeg": "image",
  "image/png": "image",
  "application/pdf": "document",
} as const;

type Props = {
  value: CannedReplyAttachment | null;
  onChange: (value: CannedReplyAttachment | null) => void;
};

export function QuickReplyAttachmentField({ value, onChange }: Props) {
  const t = useTranslations();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function upload(file: File) {
    setError(null);
    const kind = ACCEPTED[file.type as keyof typeof ACCEPTED];
    if (!kind) {
      setError(t("admin.pages.quickReplies.attachWrongType"));
      return;
    }
    if (file.size > QUICK_REPLY_MAX_FILE_BYTES) {
      setError(t("admin.pages.quickReplies.attachTooBig"));
      return;
    }
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}-${file.name.replace(/[^\w.-]+/g, "_")}`;
      const { error: uploadError } = await createClient()
        .storage.from(QUICK_REPLY_BUCKET)
        .upload(path, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      onChange({ kind, mime: file.type, path, name: file.name, size: file.size } as CannedReplyAttachment);
    } catch {
      setError(t("admin.pages.quickReplies.attachFailed"));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const Icon = value?.kind === "location" ? MapPin : value?.kind === "image" ? ImageIcon : FileText;

  return (
    <div className="space-y-2">
      <Label>{t("admin.pages.quickReplies.attachment")}</Label>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm">
          <span className="flex min-w-0 items-center gap-2">
            <Icon className="size-4 shrink-0" aria-hidden />
            <span className="truncate">
              {value.kind === "location" ? t("admin.pages.quickReplies.attachLocation") : value.name}
            </span>
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("admin.pages.quickReplies.attachRemove")}
            onClick={() => onChange(null)}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("admin.pages.quickReplies.attachNone")}</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          {uploading ? t("admin.saving") : t("admin.pages.quickReplies.attachUpload")}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ kind: "location" })}>
          {t("admin.pages.quickReplies.attachLocation")}
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }}
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
