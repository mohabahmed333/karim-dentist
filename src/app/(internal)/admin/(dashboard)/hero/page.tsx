import { HeroEditor } from "@/features/admin/components/HeroEditor";
import { getPortfolioData } from "@/services/portfolio";

export default async function AdminHeroPage() {
  const data = await getPortfolioData();
  return <HeroEditor hero={data.hero} />;
}
