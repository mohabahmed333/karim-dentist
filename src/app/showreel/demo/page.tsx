import { ShowreelDemoClient } from "@/features/portfolio/showreel/ShowreelDemoClient";
import { buildShowreelCustomizeRoute } from "@/features/portfolio/showreel/showreelDemoRoute";
import {
  parseShowreelDemoMode,
  parseShowreelProductScene,
} from "@/features/portfolio/showreel/showreelProductRoute";
import {
  getCustomizePortfolioData,
  getPortfolioData,
  getShowreelBookingData,
} from "@/services/portfolio";
import type { PortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

const EMPTY_PORTFOLIO: PortfolioData = {
  settings: null,
  hero: null,
  about: null,
  callout: null,
  caseStudies: [],
  caseStudySections: {},
  caseStudyDetailPageIds: [],
  featured: [],
  featuredProjectSections: {},
  featuredDetailPageIds: [],
  experience: [],
  services: [],
  clients: [],
  footerLinks: [],
  socialLinks: [],
  trustItems: [],
  solutionPanels: [],
  galleryItems: [],
  galleryShowcase: null,
  galleryComparisons: [],
};

type SearchParams = {
  mode?: string;
  section?: string;
  view?: string;
  item?: string;
  focus?: string;
  viewport?: string;
  scene?: string;
};

export default async function ShowreelDemoPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const sp = await searchParams;
  const mode = parseShowreelDemoMode(sp.mode);
  const productScene = parseShowreelProductScene(sp.scene);
  const viewport = sp.viewport === "mobile" ? "mobile" : "desktop";

  if (mode === "product") {
    // site-to-chat needs live CMS services for the real BookingForm —
    // but only settings + services, not the whole portfolio.
    const siteData =
      productScene === "site-to-chat"
        ? await getShowreelBookingData()
        : EMPTY_PORTFOLIO;

    return (
      <ShowreelDemoClient
        mode="product"
        customizeData={EMPTY_PORTFOLIO}
        siteData={siteData}
        initialRoute={buildShowreelCustomizeRoute({}, EMPTY_PORTFOLIO)}
        viewport={viewport}
        productScene={productScene}
      />
    );
  }

  const [customizeData, siteData] = await Promise.all([
    getCustomizePortfolioData(),
    getPortfolioData(),
  ]);
  const initialRoute = buildShowreelCustomizeRoute(sp, customizeData);

  return (
    <ShowreelDemoClient
      mode={mode}
      customizeData={customizeData}
      siteData={siteData}
      initialRoute={initialRoute}
      viewport={viewport}
      productScene={productScene}
    />
  );
}
