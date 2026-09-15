"use client";

import type { SiteSettings } from "@/services/site_settings";
import { MediaUploadField } from "./MediaUploadField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from "@/lib/i18n";

type Props = {
  settings: SiteSettings | null;
  cardImageUrl: string;
  onCardImageChange: (url: string) => void;
};

/** Admin form fields for clinic/doctor card (uncontrolled inputs + image state). */
export function ContactCardAdminFields({
  settings,
  cardImageUrl,
  onCardImageChange,
}: Props) {
  const t = useTranslations();
  return (
    <div className="space-y-4 border-t border-border pt-4">
      <p className="text-sm font-medium">{t("admin.pages.contact.businessCard")}</p>
      <div className="space-y-2">
        <Label htmlFor="contact_clinic_name">{t("admin.pages.contact.clinicName")}</Label>
        <Input
          id="contact_clinic_name"
          name="contact_clinic_name"
          defaultValue={settings?.contact_clinic_name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_clinic_name_ar">{t("admin.pages.contact.clinicNameAr")}</Label>
        <Input
          id="contact_clinic_name_ar"
          name="contact_clinic_name_ar"
          defaultValue={settings?.contact_clinic_name_ar ?? ""}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_doctor_name">{t("admin.pages.contact.doctorName")}</Label>
        <Input
          id="contact_doctor_name"
          name="contact_doctor_name"
          defaultValue={settings?.contact_doctor_name ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_doctor_name_ar">{t("admin.pages.contact.doctorNameAr")}</Label>
        <Input
          id="contact_doctor_name_ar"
          name="contact_doctor_name_ar"
          defaultValue={settings?.contact_doctor_name_ar ?? ""}
          dir="rtl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_credentials">{t("admin.pages.contact.credentials")}</Label>
        <Textarea
          id="contact_credentials"
          name="contact_credentials"
          rows={4}
          defaultValue={settings?.contact_credentials ?? ""}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact_credentials_ar">{t("admin.pages.contact.credentialsAr")}</Label>
        <Textarea
          id="contact_credentials_ar"
          name="contact_credentials_ar"
          rows={4}
          defaultValue={settings?.contact_credentials_ar ?? ""}
          dir="rtl"
        />
      </div>
      <MediaUploadField
        label={t("admin.pages.contact.cardImage")}
        bucket="about"
        folder="contact"
        mediaType="image"
        onMediaTypeChange={() => undefined}
        value={cardImageUrl || null}
        onChange={(url) => onCardImageChange(url ?? "")}
      />
      {cardImageUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onCardImageChange("")}
        >
          {t("admin.pages.contact.clearImage")}
        </Button>
      ) : null}
    </div>
  );
}
