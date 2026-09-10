import { CustomizeProvider, CustomizeShell } from "@/features/customize";
import { getCustomizePortfolioData } from "@/services/portfolio";

export const dynamic = "force-dynamic";

export default async function CustomizeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const data = await getCustomizePortfolioData();

  return (
    <CustomizeProvider initial={data}>
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <CustomizeShell />
        {children}
      </div>
    </CustomizeProvider>
  );
}
