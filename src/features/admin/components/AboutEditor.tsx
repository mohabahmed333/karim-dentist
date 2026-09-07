"use client";

import { useTranslations } from "@/lib/i18n";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { upsertAbout, type About } from "@/services/about";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { MediaUploadField, type MediaKind } from "./MediaUploadField";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Props = { about: About | null };

export function AboutEditor({ about: initial }: Props) {
  const t = useTranslations();
  const [about, setAbout] = useState(initial);
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [secondaryImage, setSecondaryImage] = useState(initial?.copy_image_url ?? "");
  const [mediaType, setMediaType] = useState<MediaKind>(
    initial?.media_type ?? "image",
  );
  const [logoUrl, setLogoUrl] = useState(initial?.drop_cap_logo_url ?? "");
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const row = await upsertAbout(about, {
        drop_cap: String(form.get("drop_cap") ?? ""),
        drop_cap_logo_url: logoUrl || null,
        body: String(form.get("body") ?? ""),
        image_url: imageUrl || null,
        copy_image_url: secondaryImage || null,
        media_type: mediaType,
      });
      setAbout(row);
      toast.success(t("admin.cms.saveSuccess"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("admin.saveFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <LocalizedAdminPageHeader
        titleKey="admin.pages.about.title"
        descriptionKey="admin.pages.about.description"
      />
      <Card className="max-w-2xl gap-0 p-6">
        <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <MediaUploadField
            label="Main portrait"
            bucket="about"
            folder="portrait"
            mediaType={mediaType}
            onMediaTypeChange={setMediaType}
            value={imageUrl || null}
            onChange={(url) => setImageUrl(url ?? "")}
          />
          <MediaUploadField
            label="Secondary image"
            bucket="about"
            folder="about-secondary"
            mediaType="image"
            onMediaTypeChange={() => undefined}
            value={secondaryImage || null}
            onChange={(url) => setSecondaryImage(url ?? "")}
          />
          <MediaUploadField
            label="Drop-cap logo (optional)"
            bucket="about"
            folder="drop-cap"
            mediaType="image"
            onMediaTypeChange={() => undefined}
            value={logoUrl || null}
            onChange={(url) => setLogoUrl(url ?? "")}
          />
          {logoUrl ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setLogoUrl("")}
            >
              Remove logo
            </Button>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="drop_cap">Drop-cap letter (optional)</Label>
            <Input
              id="drop_cap"
              name="drop_cap"
              defaultValue={about?.drop_cap ?? ""}
              placeholder="O"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea id="body" name="body" defaultValue={about?.body ?? ""} />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.save")}
          </Button>
        </form>
      </Card>
    </>
  );
}
