import type { Metadata } from "next";
import { ShowreelPage } from "@/features/portfolio/showreel/ShowreelPage";
import { getPortfolioData } from "@/services/portfolio";

export const metadata: Metadata = {
  title: "Showreel — Mohab Elbasiry",
  description:
    "Recording view for the Imagineer portfolio — designed and developed by Mohab Elbasiry.",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const data = await getPortfolioData();
  const hero = data.hero;
  const videoDesktop =
    hero?.media_url_desktop ?? hero?.media_url ?? "/hero/desktop.mp4";
  const videoMobile = hero?.media_url_mobile ?? videoDesktop;

  return (
    <ShowreelPage videoDesktop={videoDesktop} videoMobile={videoMobile} />
  );
}
