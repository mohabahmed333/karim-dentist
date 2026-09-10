import { AboutEditor } from "@/features/admin/components/AboutEditor";
import { TrustItemsEditor } from "@/features/admin/components/TrustItemsEditor";
import { getPortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export default async function AdminAboutPage() {
  const data = await getPortfolioData();
  return (
    <div className="space-y-10">
      <AboutEditor about={data.about} />
      <TrustItemsEditor items={data.trustItems} />
    </div>
  );
}
