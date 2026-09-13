import { HeroEditor } from "@/features/admin/components/HeroEditor";
import { getPortfolioData } from "@/services/portfolio";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export default async function AdminHeroPage() {
  await requirePagePermission("hero.view");
  const data = await getPortfolioData();
  return <HeroEditor hero={data.hero} />;
}
