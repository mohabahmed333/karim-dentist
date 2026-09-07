"use client";

import type { Tables } from "@/lib/supabase/database.types";
import { resolveDentalHeroCopy } from "@/features/portfolio/lib/dentalThemeCopy";
import { splitHeroAccent } from "@/features/portfolio/lib/splitHeroAccent";
import { dentalFullBleed } from "@/features/portfolio/lib/dentalLayout";
import { mediaSrc } from "@/features/portfolio/lib/mediaSrc";
import { useLocale, useTranslations } from "@/lib/i18n";
import { Brand } from "./Brand";
import { DentalHeroClientLogos } from "./DentalHeroClientLogos";
import { DentalHeroCopy } from "./DentalHeroCopy";
import { DentalHeroMedia } from "./DentalHeroMedia";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { MenuToggle } from "./MenuToggle";
import { cn } from "@/lib/utils";

type Props = {
  hero: Tables<"hero">;
  brand: string;
  brandLogo?: string | null;
  clients?: Tables<"clients">[];
  onMenuToggle: () => void;
  menuOpen: boolean;
};

export function DentalHeroSection({
  hero,
  brand,
  brandLogo,
  clients = [],
  onMenuToggle,
  menuOpen,
}: Props) {
  const t = useTranslations();
  const { locale } = useLocale();
  const image = mediaSrc(hero.media_url_desktop ?? hero.media_url);
  const copy = resolveDentalHeroCopy(
    hero,
    {
      headline:
        t("heroTitleBefore") + t("heroTitleEm") + t("heroTitleAfter"),
      accent: "",
      body: t("heroText"),
      cta: t("heroCta"),
    },
    locale,
  );
  const combined =
    copy.accent && !copy.headline.includes(copy.accent)
      ? `${copy.headline}${copy.accent}`
      : copy.headline;
  const title = splitHeroAccent(combined, "", t("heroTitleEm"));
  const after =
    title.after ||
    (title.accent &&
    !combined.includes(t("heroTitleAfter").trim()) &&
    !/one visit|كل زيارة/i.test(combined)
      ? t("heroTitleAfter")
      : "");

  return (
    <section
      className={cn("bg-white", dentalFullBleed, "py-[var(--page-gutter)]")}
      id="home"
      data-customize-section="hero"
    >
      <div
        className={cn(
          "grid w-full grid-cols-1 items-stretch gap-6 lg:[min-height:min(860px,calc(100vh-2.5rem))]",
          image ? "lg:grid-cols-2" : null,
        )}
      >
        <div className="flex min-h-0 flex-col px-5 pb-6 pt-3 sm:px-6 lg:pe-6 lg:ps-5">
          <div
            data-hero-topbar
            className="mb-10 flex items-center justify-between gap-4"
          >
            <Brand
              name={brand}
              logoUrl={brandLogo}
              showLogo={false}
              ariaLabel={t("brandAria")}
              className="text-[1.2rem] tracking-[-0.03em]"
            />
            <div className="flex items-center gap-[0.55rem]">
              <LanguageSwitcher className="hidden sm:inline-flex" />
              <MenuToggle
                expanded={menuOpen}
                onClick={onMenuToggle}
                ariaLabel={menuOpen ? t("menuCloseAria") : t("menuOpenAria")}
              />
            </div>
          </div>
          <DentalHeroCopy
            kicker={copy.kicker}
            headline={title.before}
            accent={title.accent}
            after={after}
            body={copy.body}
            cta={copy.cta}
            ctaHref={hero.cta_primary_href || "#contact"}
          />
          <DentalHeroClientLogos
            clients={clients}
            ariaLabel={t("heroPartnersAria")}
          />
        </div>
        {image ? (
          <DentalHeroMedia
            image={image}
            contactLabel={t("heroContactChip")}
            imageAlt={t("heroDoctorAlt")}
          />
        ) : null}
      </div>
    </section>
  );
}
