"use client";

import { FormEvent, useState } from "react";
import { MediaUploadField, type MediaKind } from "./MediaUploadField";
import { CaseStudyFields } from "./CaseStudyFields";
import type { CaseStudy } from "@/services/case_studies";

type Props = {
  item: CaseStudy;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function CaseStudyForm({ item, onSubmit, pending, message }: Props) {
  const [mediaUrl, setMediaUrl] = useState(item.media_url ?? "");
  const [mediaType, setMediaType] = useState<MediaKind>(
    item.media_type ?? "image",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tags = String(form.get("tags") ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    await onSubmit({
      title: String(form.get("title") ?? ""),
      description: String(form.get("description") ?? ""),
      year: String(form.get("year") ?? "") || null,
      category: String(form.get("category") ?? "") || null,
      client: String(form.get("client") ?? "") || null,
      director: String(form.get("director") ?? "") || null,
      agency: String(form.get("agency") ?? "") || null,
      production_company: String(form.get("production_company") ?? "") || null,
      tags,
      media_url: mediaUrl || null,
      media_type: mediaType,
      is_published: form.get("is_published") === "true",
    });
  }

  return (
    <form
      id="case-study-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <CaseStudyFields item={item} />
      <MediaUploadField
        label="Card media"
        bucket="projects"
        folder="case-studies"
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
        value={mediaUrl || null}
        onChange={(url) => setMediaUrl(url ?? "")}
      />
      {message ? (
        <p className="text-sm text-muted-foreground">{message}</p>
      ) : null}
      {pending ? (
        <p className="text-sm text-muted-foreground">Saving…</p>
      ) : null}
    </form>
  );
}
