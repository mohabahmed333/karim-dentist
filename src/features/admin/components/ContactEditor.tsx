"use client";

import { useTranslations } from "@/lib/i18n";
import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { upsertSettings, type SiteSettings } from "@/services/site_settings";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { SettingsContactFields } from "./SettingsContactFields";
import { ContactCardAdminFields } from "./ContactCardAdminFields";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Props = { settings: SiteSettings | null };

export function ContactEditor({ settings: initial }: Props) {
  const t = useTranslations();
  const [settings, setSettings] = useState(initial);
  const [cardImageUrl, setCardImageUrl] = useState(
    initial?.contact_card_image_url ?? "",
  );
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      const row = await upsertSettings(settings, {
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
        contact_clinic_name: String(form.get("contact_clinic_name") ?? ""),
        contact_clinic_name_ar: String(form.get("contact_clinic_name_ar") ?? ""),
        contact_doctor_name: String(form.get("contact_doctor_name") ?? ""),
        contact_doctor_name_ar: String(form.get("contact_doctor_name_ar") ?? ""),
        contact_credentials: String(form.get("contact_credentials") ?? ""),
        contact_credentials_ar: String(form.get("contact_credentials_ar") ?? ""),
        contact_card_image_url: cardImageUrl || null,
      });
      setSettings(row);
      setCardImageUrl(row.contact_card_image_url ?? "");
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
        titleKey="admin.pages.contact.title"
        descriptionKey="admin.pages.contact.description"
        actions={
          <Button type="submit" form="contact-form" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.saveChanges")}
          </Button>
        }
      />
      <Card className="w-full max-w-none gap-0 p-6">
        <form id="contact-form" className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
          <SettingsContactFields settings={settings} />
          <ContactCardAdminFields
            settings={settings}
            cardImageUrl={cardImageUrl}
            onCardImageChange={setCardImageUrl}
          />
        </form>
      </Card>
    </>
  );
}
