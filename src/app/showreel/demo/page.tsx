import { ShowreelDemoClient } from "@/features/portfolio/showreel/ShowreelDemoClient";
import { buildShowreelCustomizeRoute } from "@/features/portfolio/showreel/showreelDemoRoute";
import {
  getCustomizePortfolioData,
  getPortfolioData,
} from "@/services/portfolio";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

type SearchParams = {
  mode?: string;
  section?: string;
  view?: string;
  item?: string;
  focus?: string;
  viewport?: string;
};

export default async function ShowreelDemoPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<SearchParams>;
}>) {
  const sp = await searchParams;
  const mode = sp.mode === "customize" ? "customize" : "site";
  const [customizeData, siteData] = await Promise.all([
    getCustomizePortfolioData(),
    getPortfolioData(),
  ]);
  const initialRoute = buildShowreelCustomizeRoute(sp, customizeData);
  const viewport = sp.viewport === "mobile" ? "mobile" : "desktop";

  return (
    <ShowreelDemoClient
      mode={mode}
      customizeData={customizeData}
      siteData={siteData}
      initialRoute={initialRoute}
      viewport={viewport}
    />
  );
}
