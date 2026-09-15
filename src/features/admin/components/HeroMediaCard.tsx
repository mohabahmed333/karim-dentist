"use client";

import { MediaUploadField, type MediaKind } from "./MediaUploadField";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "@/lib/i18n";

type Props = {
  mediaType: MediaKind;
  onMediaTypeChange: (type: MediaKind) => void;
  desktop: string;
  onDesktopChange: (url: string | null) => void;
  mobile: string;
  onMobileChange: (url: string | null) => void;
};

export function HeroMediaCard({
  mediaType,
  onMediaTypeChange,
  desktop,
  onDesktopChange,
  mobile,
  onMobileChange,
}: Props) {
  const t = useTranslations();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.customize.media")}</CardTitle>
        <CardDescription>{t("admin.pages.hero.mediaDesc")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <MediaUploadField
          label={t("admin.pages.hero.desktop")}
          bucket="hero"
          folder="desktop"
          mediaType={mediaType}
          onMediaTypeChange={onMediaTypeChange}
          value={desktop || null}
          onChange={onDesktopChange}
        />
        <Separator />
        <MediaUploadField
          label={t("admin.pages.hero.mobile")}
          bucket="hero"
          folder="mobile"
          mediaType={mediaType}
          onMediaTypeChange={onMediaTypeChange}
          value={mobile || null}
          onChange={onMobileChange}
        />
      </CardContent>
    </Card>
  );
}
