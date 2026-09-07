"use client";

import { useTranslations } from "@/lib/i18n";
import { useState } from "react";
import type { Hero } from "@/services/hero";
import { useHeroSave } from "../hooks/useHeroSave";
import { LocalizedAdminPageHeader } from "./LocalizedAdminPageHeader";
import { HeroCopyFields } from "./HeroCopyFields";
import { HeroCtaFields } from "./HeroCtaFields";
import { HeroHeadlineImageField } from "./HeroHeadlineImageField";
import { HeroMediaCard } from "./HeroMediaCard";
import type { MediaKind } from "./MediaUploadField";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Props = { hero: Hero | null };

export function HeroEditor({ hero }: Props) {
  const t = useTranslations();
  const [mediaType, setMediaType] = useState<MediaKind>(
    hero?.media_type ?? "video",
  );
  const [desktop, setDesktop] = useState(hero?.media_url_desktop ?? "");
  const [mobile, setMobile] = useState(hero?.media_url_mobile ?? "");
  const [headlineImage, setHeadlineImage] = useState(
    hero?.headline_image_url ?? "",
  );
  const { pending, onSubmit } = useHeroSave(
    hero,
    mediaType,
    desktop,
    mobile,
    headlineImage,
  );

  return (
    <div className="mx-auto max-w-3xl">
      <LocalizedAdminPageHeader
        titleKey="admin.pages.hero.title"
        descriptionKey="admin.pages.hero.description"
        actions={
          <Button type="submit" form="hero-form" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.saveChanges")}
          </Button>
        }
      />
      <form
        id="hero-form"
        className="space-y-6"
        onSubmit={(e) => void onSubmit(e)}
      >
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.cms.copy")}</CardTitle>
            <CardDescription>{t("admin.pages.hero.copyDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <HeroHeadlineImageField
              value={headlineImage || null}
              onChange={(url) => setHeadlineImage(url ?? "")}
            />
            <HeroCopyFields hero={hero} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.cms.ctas")}</CardTitle>
            <CardDescription>{t("admin.cms.ctasDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <HeroCtaFields hero={hero} />
          </CardContent>
        </Card>
        <HeroMediaCard
          mediaType={mediaType}
          onMediaTypeChange={setMediaType}
          desktop={desktop}
          onDesktopChange={(url) => setDesktop(url ?? "")}
          mobile={mobile}
          onMobileChange={(url) => setMobile(url ?? "")}
        />
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending}>
            {pending ? t("admin.saving") : t("admin.saveChanges")}
          </Button>
        </div>
      </form>
    </div>
  );
}
