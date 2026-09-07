"use client";

import { MediaUploadField } from "@/features/admin/components/MediaUploadField";
import { useTranslations } from "@/lib/i18n";

type Props = {
  value: string;
  onChange: (url: string) => void;
};

export function FooterIconUploadField({ value, onChange }: Props) {
  const t = useTranslations();

  return (
    <MediaUploadField
      label={t("admin.customize.customIcon")}
      bucket="clients"
      folder="footer-icons"
      mediaType="image"
      onMediaTypeChange={() => undefined}
      value={value || null}
      onChange={(url) => onChange(url ?? "")}
      removeLabel={t("admin.customize.clearIcon")}
    />
  );
}
