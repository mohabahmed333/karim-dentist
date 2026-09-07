"use client";

import { FormEvent, useState } from "react";
import { MediaUploadField, type MediaKind } from "./MediaUploadField";
import type { FeaturedProject } from "@/services/featured_projects";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  item: FeaturedProject;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function FeaturedForm({ item, onSubmit, pending, message }: Props) {
  const [imageUrl, setImageUrl] = useState(item.image_url ?? "");
  const [mediaType, setMediaType] = useState<MediaKind>(
    item.media_type ?? "image",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      title: String(form.get("title") ?? ""),
      image_url: imageUrl || null,
      media_type: mediaType,
      is_published: form.get("is_published") === "true",
    });
  }

  return (
    <form
      id="featured-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div className="space-y-2">
        <Label htmlFor="title">Internal name</Label>
        <Input
          id="title"
          name="title"
          defaultValue={item.title}
          key={item.id + "title"}
        />
        <p className="text-xs text-muted-foreground">
          Used in the admin list only — not shown on the card.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="is_published">status</Label>
        <select
          id="is_published"
          name="is_published"
          defaultValue={item.is_published ? "true" : "false"}
          key={item.id + "pub"}
          className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground shadow-xs"
        >
          <option value="false">Draft</option>
          <option value="true">Published</option>
        </select>
      </div>
      <MediaUploadField
        label="Card media"
        bucket="projects"
        folder="featured"
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
        value={imageUrl || null}
        onChange={(url) => setImageUrl(url ?? "")}
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
