"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { upsertSettings, type SiteSettings } from "@/services/site_settings";
import { MediaUploadField } from "./MediaUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SettingsContactFields } from "./SettingsContactFields";
import { FooterTaglineImageField } from "./FooterTaglineImageField";

type Props = { settings: SiteSettings | null };

export function SettingsSiteForm({ settings: initial }: Props) {
  const [settings, setSettings] = useState(initial);
  const [logoUrl, setLogoUrl] = useState(initial?.brand_logo_url ?? "");
  const [taglineImage, setTaglineImage] = useState(
    initial?.footer_tagline_image_url ?? "",
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const row = await upsertSettings(settings, {
        brand_name: String(form.get("brand_name") ?? ""),
        brand_logo_url: logoUrl || null,
        footer_tagline: String(form.get("footer_tagline") ?? ""),
        footer_tagline_image_url: taglineImage || null,
        contact_headline: String(form.get("contact_headline") ?? ""),
        contact_blurb: String(form.get("contact_blurb") ?? ""),
        contact_email: String(form.get("contact_email") ?? ""),
        contact_email_secondary: String(form.get("contact_email_secondary") ?? ""),
        contact_phone: String(form.get("contact_phone") ?? ""),
        contact_mobile: String(form.get("contact_mobile") ?? ""),
        contact_phone_secondary: String(form.get("contact_phone_secondary") ?? ""),
        contact_address: String(form.get("contact_address") ?? ""),
        contact_city: String(form.get("contact_city") ?? ""),
        contact_country: String(form.get("contact_country") ?? ""),
        contact_hours: String(form.get("contact_hours") ?? ""),
        contact_map_url: String(form.get("contact_map_url") ?? ""),
        contact_whatsapp: String(form.get("contact_whatsapp") ?? ""),
        contact_telegram: String(form.get("contact_telegram") ?? ""),
        contact_behance: String(form.get("contact_behance") ?? ""),
        contact_linkedin: String(form.get("contact_linkedin") ?? ""),
        contact_instagram: String(form.get("contact_instagram") ?? ""),
        contact_facebook: String(form.get("contact_facebook") ?? ""),
        contact_x: String(form.get("contact_x") ?? ""),
      });
      setSettings(row);
      toast.success("Saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
      <MediaUploadField
        label="Header logo (PNG)"
        bucket="about"
        folder="brand"
        mediaType="image"
        onMediaTypeChange={() => undefined}
        value={logoUrl || null}
        onChange={(url) => setLogoUrl(url ?? "")}
      />
      {logoUrl ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => setLogoUrl("")}>
          Remove logo
        </Button>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="brand_name">Brand name</Label>
        <Input id="brand_name" name="brand_name" defaultValue={settings?.brand_name ?? ""} />
      </div>
      <div className="space-y-2">
        <FooterTaglineImageField
          value={taglineImage || null}
          onChange={(url) => setTaglineImage(url ?? "")}
        />
        <Label htmlFor="footer_tagline">Footer tagline (text fallback)</Label>
        <Input
          id="footer_tagline"
          name="footer_tagline"
          defaultValue={settings?.footer_tagline ?? ""}
        />
      </div>
      <SettingsContactFields settings={settings} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
