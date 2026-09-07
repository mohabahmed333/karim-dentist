import {
  PortfolioMotion,
  ServicesSection,
  SiteFooter,
  SiteNav,
} from "@/features/portfolio";
import { TALES_TAGLINE } from "@/features/portfolio/lib/footerTaglineLines";
import { contactFromSettings } from "@/features/portfolio/lib/contactInfo";
import { workNavLinksFromPortfolio } from "@/features/portfolio/lib/workNavLinks";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Services",
  description: "Brand, campaign, and content capabilities from the studio.",
};

export default async function ServicesPage() {
  const portfolio = await getPortfolioData();
  const brand = portfolio.settings?.brand_name ?? "Imagineer";
  const brandLogo = portfolio.settings?.brand_logo_url ?? null;
  const contact = contactFromSettings(portfolio.settings);
  const workLinks = workNavLinksFromPortfolio(portfolio);
  const title = portfolio.settings?.services_title ?? "Services";

  return (
    <>
      <PortfolioMotion />
      <SiteNav
        brand={brand}
        brandLogo={brandLogo}
        contact={contact}
        workLinks={workLinks}
      />
      <div className="site-shell">
        <main>
          <ServicesSection items={portfolio.services} title={title} />
        </main>
        <SiteFooter
          brand={brand}
          tagline={portfolio.settings?.footer_tagline ?? TALES_TAGLINE}
          taglineImageUrl={portfolio.settings?.footer_tagline_image_url}
          email={portfolio.settings?.contact_email ?? "hello@imagineer.studio"}
          footerLinks={portfolio.footerLinks}
          socialLinks={portfolio.socialLinks}
        />
      </div>
    </>
  );
}
