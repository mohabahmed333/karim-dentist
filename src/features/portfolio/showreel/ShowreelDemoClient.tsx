"use client";

import { useEffect, useState } from "react";
import { CustomizeProvider } from "@/features/customize";
import type { CustomizeRoute } from "@/features/customize/context/CustomizeRouteContext";
import { ShowreelCustomizeDemoBridge } from "@/features/portfolio/showreel/ShowreelCustomizeDemoBridge";
import { ShowreelCustomizeEmbed } from "@/features/portfolio/showreel/ShowreelCustomizeEmbed";
import { buildShowreelCustomizeRoute } from "@/features/portfolio/showreel/showreelDemoRoute";
import {
  SHOWREEL_CUSTOMIZE_ROUTE,
  type ShowreelCustomizeRouteParams,
} from "@/features/portfolio/showreel/showreelEmbedMessage";
import { ShowreelSiteEmbed } from "@/features/portfolio/showreel/ShowreelSiteEmbed";
import type { PortfolioData } from "@/services/portfolio";

type Props = {
  mode: "site" | "customize";
  customizeData: PortfolioData;
  siteData: PortfolioData;
  initialRoute: CustomizeRoute;
  viewport: "desktop" | "mobile";
};

export function ShowreelDemoClient({
  mode,
  customizeData,
  siteData,
  initialRoute,
  viewport,
}: Props) {
  const [route, setRoute] = useState(initialRoute);
  const [settingsOrderTab, setSettingsOrderTab] = useState(false);

  useEffect(() => {
    if (mode !== "customize") return;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type !== SHOWREEL_CUSTOMIZE_ROUTE) return;
      const params = event.data.params as ShowreelCustomizeRouteParams;
      setRoute(buildShowreelCustomizeRoute(params, customizeData));
      setSettingsOrderTab(
        params.section === "settings" && params.view === "order",
      );
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [customizeData, mode]);

  if (mode === "customize") {
    return (
      <div className="showreel-demo-root">
        <CustomizeProvider initial={customizeData}>
          <ShowreelCustomizeDemoBridge
            initial={customizeData}
            settingsOrderTab={settingsOrderTab}
          />
          <ShowreelCustomizeEmbed route={route} />
        </CustomizeProvider>
      </div>
    );
  }

  return (
    <div className="showreel-demo-root">
      <ShowreelSiteEmbed data={siteData} viewport={viewport} />
    </div>
  );
}
