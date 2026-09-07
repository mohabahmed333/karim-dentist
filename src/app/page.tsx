import { DentalHomePage } from "@/features/portfolio/components/dental/DentalHomePage";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getPortfolioData();
  const brand = data.settings?.brand_name ?? "The Dental Lounge";
  const brandLogo =
    data.settings?.brand_logo_url ??
    "/dental/766800441_18084577118253727_1449914596899119909_n.jpg";

  return <DentalHomePage data={data} brand={brand} brandLogo={brandLogo} />;
}
