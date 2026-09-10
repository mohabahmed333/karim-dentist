"use client";

import { CustomizeProvider } from "@/features/customize";
import type { CustomizeRoute } from "@/features/customize/context/CustomizeRouteContext";
import { ShowreelCustomizeDemoBridge } from "./ShowreelCustomizeDemoBridge";
import { ShowreelCustomizeEmbed } from "./ShowreelCustomizeEmbed";
import type { PortfolioData } from "@/services/portfolio";

type Props = {
  customizeData: PortfolioData;
  settingsOrderTab: boolean;
  route: CustomizeRoute;
};

/** The whole customize editor, kept in one file so ShowreelDemoClient can
    lazy-load it as a single chunk — product and site iframes were paying
    for it (~1.1MB of dev JS) without ever rendering it. */
export function ShowreelCustomizeBranch({
  customizeData,
  settingsOrderTab,
  route,
}: Props) {
  return (
    <CustomizeProvider initial={customizeData}>
      <ShowreelCustomizeDemoBridge
        initial={customizeData}
        settingsOrderTab={settingsOrderTab}
      />
      <ShowreelCustomizeEmbed route={route} />
    </CustomizeProvider>
  );
}
