"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { CustomizeRoute } from "@/features/customize/context/CustomizeRouteContext";
import { buildShowreelCustomizeRoute } from "@/features/portfolio/showreel/showreelDemoRoute";
import {
  SHOWREEL_CUSTOMIZE_ROUTE,
  type ShowreelCustomizeRouteParams,
} from "@/features/portfolio/showreel/showreelEmbedMessage";
import type { ShowreelProductScene } from "@/features/portfolio/showreel/showreelSlideTypes";
import type { PortfolioData } from "@/services/portfolio";
import "./showreel.css";

// Only one of these three branches ever renders per iframe, but importing
// them statically put all of them in every /showreel/demo document. ssr is
// left on so each branch's readiness marker still lands in the first HTML.
const ShowreelCustomizeBranch = dynamic(() =>
  import("./ShowreelCustomizeBranch").then((m) => m.ShowreelCustomizeBranch),
);
const ShowreelSiteEmbed = dynamic(() =>
  import("./ShowreelSiteEmbed").then((m) => m.ShowreelSiteEmbed),
);
const ShowreelProductDemo = dynamic(() =>
  import("./product-scenes/ShowreelProductDemo").then(
    (m) => m.ShowreelProductDemo,
  ),
);

type Props = {
  mode: "site" | "customize" | "product";
  customizeData: PortfolioData;
  siteData: PortfolioData;
  initialRoute: CustomizeRoute;
  viewport: "desktop" | "mobile";
  productScene?: ShowreelProductScene;
};

export function ShowreelDemoClient({
  mode,
  customizeData,
  siteData,
  initialRoute,
  viewport,
  productScene = "ai-booking",
}: Props) {
  const [route, setRoute] = useState(initialRoute);
  const [settingsOrderTab, setSettingsOrderTab] = useState(false);

  useLayoutEffect(() => {
    document.documentElement.dataset.showreelDemo = "1";
  }, []);

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

  if (mode === "product") {
    return (
      <div className="showreel-demo-root">
        <ShowreelProductDemo scene={productScene} siteData={siteData} />
      </div>
    );
  }

  if (mode === "customize") {
    return (
      <div className="showreel-demo-root">
        <ShowreelCustomizeBranch
          customizeData={customizeData}
          settingsOrderTab={settingsOrderTab}
          route={route}
        />
      </div>
    );
  }

  return (
    <div className="showreel-demo-root">
      <ShowreelSiteEmbed data={siteData} viewport={viewport} />
    </div>
  );
}
