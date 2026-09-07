"use client";

import { FormEvent, useState } from "react";
import { MediaUploadField, type MediaKind } from "./MediaUploadField";
import type { Client } from "@/services/clients";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  item: Client;
  onSubmit: (payload: Record<string, unknown>) => Promise<void>;
  pending: boolean;
  message: string | null;
};

export function ClientForm({ item, onSubmit, pending, message }: Props) {
  const [logoUrl, setLogoUrl] = useState(item.logo_url ?? "");
  const [mediaType, setMediaType] = useState<MediaKind>(
    item.media_type ?? "image",
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await onSubmit({
      name: String(form.get("name") ?? ""),
      logo_url: logoUrl || null,
      media_type: mediaType,
    });
  }

  return (
    <form
      id="client-form"
      className="space-y-4"
      onSubmit={(e) => void handleSubmit(e)}
    >
      <div className="space-y-2">
        <Label htmlFor="name">name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={item.name}
          key={item.id + "name"}
        />
      </div>
      <MediaUploadField
        label="Logo media"
        bucket="clients"
        folder="logos"
        mediaType={mediaType}
        onMediaTypeChange={setMediaType}
        value={logoUrl || null}
        onChange={(url) => setLogoUrl(url ?? "")}
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
