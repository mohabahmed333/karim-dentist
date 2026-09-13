import { AboutEditor } from "@/features/admin/components/AboutEditor";
import { TrustItemsEditor } from "@/features/admin/components/TrustItemsEditor";
import { getPortfolioData } from "@/services/portfolio";
import { requirePagePermission } from "@/lib/auth/pageGuard";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  await requirePagePermission("about.view");
  const data = await getPortfolioData();
  return (
    <div className="space-y-10">
      <AboutEditor about={data.about} />
      <TrustItemsEditor items={data.trustItems} />
    </div>
  );
}
