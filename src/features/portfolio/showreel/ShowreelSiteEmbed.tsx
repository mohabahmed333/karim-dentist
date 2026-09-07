import {
  HeroSection,
  HomeMainSections,
  PortfolioMotion,
  SiteFooter,
  SiteNav,
} from "@/features/portfolio";
import { TALES_TAGLINE } from "@/features/portfolio/lib/footerTaglineLines";
import { contactFromSettings } from "@/features/portfolio/lib/contactInfo";
import { workNavLinksFromPortfolio } from "@/features/portfolio/lib/workNavLinks";
import type { PortfolioData } from "@/services/portfolio";

type Props = {
  data: PortfolioData;
  viewport?: "desktop" | "mobile";
};

export function ShowreelSiteEmbed({ data, viewport = "desktop" }: Props) {
  const brand = data.settings?.brand_name ?? "Imagineer";
  const brandLogo = data.settings?.brand_logo_url ?? null;
  const contact = contactFromSettings(data.settings);
  const workLinks = workNavLinksFromPortfolio(data);
  const hero = data.hero!;

  return (
    <div
      className={
        viewport === "mobile"
          ? "showreel-demo-site is-mobile"
          : "showreel-demo-site"
      }
    >
      <PortfolioMotion />
      <SiteNav
        brand={brand}
        brandLogo={brandLogo}
        contact={contact}
        workLinks={workLinks}
      />
      <div className="site-shell">
        <main>
          <HeroSection hero={hero} />
          <HomeMainSections data={data} />
        </main>
        <SiteFooter
          brand={brand}
          tagline={data.settings?.footer_tagline ?? TALES_TAGLINE}
          taglineImageUrl={data.settings?.footer_tagline_image_url}
          email={data.settings?.contact_email ?? "hello@imagineer.studio"}
          footerLinks={data.footerLinks}
          socialLinks={data.socialLinks}
        />
      </div>
    </div>
  );
}
