"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { updateHero, type Hero } from "@/services/hero";
import type { MediaKind } from "../components/MediaUploadField";

export function useHeroSave(
  hero: Hero | null,
  mediaType: MediaKind,
  desktop: string,
  mobile: string,
  headlineImage: string,
) {
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!hero) {
      toast.error("No hero row yet — push migrations first.");
      return;
    }
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await updateHero(hero.id, {
        kicker: String(form.get("kicker") ?? ""),
        headline: String(form.get("headline") ?? ""),
        accent: String(form.get("accent") ?? ""),
        body: String(form.get("body") ?? ""),
        cta_primary_label: String(form.get("cta_primary_label") ?? ""),
        cta_primary_href: String(form.get("cta_primary_href") ?? ""),
        cta_secondary_label: String(form.get("cta_secondary_label") ?? ""),
        cta_secondary_href: String(form.get("cta_secondary_href") ?? ""),
        media_type: mediaType,
        media_url_desktop: desktop || null,
        media_url_mobile: mobile || null,
        media_url: desktop || null,
        headline_image_url: headlineImage || null,
      });
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return { pending, onSubmit };
}
