"use client";

import { useEffect, useRef } from "react";
import { useCustomize } from "@/features/customize/context/CustomizeContext";
import {
  moveHomepageSection,
  normalizeHomepageSectionOrder,
} from "@/features/portfolio/lib/homepageSectionOrder";
import type { PortfolioData } from "@/services/portfolio";
import {
  SHOWREEL_CUSTOMIZE_DEMO,
  type ShowreelCustomizeDemoMessage,
} from "./showreelEmbedMessage";

type Props = {
  initial: PortfolioData;
  settingsOrderTab: boolean;
};

function isDemoMessage(data: unknown): data is ShowreelCustomizeDemoMessage {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as ShowreelCustomizeDemoMessage).type === SHOWREEL_CUSTOMIZE_DEMO
  );
}

/** Applies parent-driven showreel demo patches inside CustomizeProvider. */
export function ShowreelCustomizeDemoBridge({
  initial,
  settingsOrderTab,
}: Props) {
  const { data, patchCollectionItem, patchSettings } = useCustomize();
  const initialRef = useRef(initial);
  const dataRef = useRef(data);

  useEffect(() => {
    initialRef.current = initial;
  }, [initial]);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    if (!settingsOrderTab) return;
    const id = window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("customize-tour-settings-tab", { detail: "order" }),
      );
    }, 40);
    return () => window.clearTimeout(id);
  }, [settingsOrderTab]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isDemoMessage(event.data)) return;

      const snapshot = initialRef.current;
      const live = dataRef.current;
      const firstId = snapshot.caseStudies[0]?.id;

      if (event.data.action === "reset") {
        if (firstId) {
          patchCollectionItem("case-studies", firstId, {
            title: snapshot.caseStudies[0]?.title ?? "",
          });
        }
        patchSettings({
          homepage_section_order: normalizeHomepageSectionOrder(
            snapshot.settings?.homepage_section_order,
          ),
        });
        return;
      }

      if (event.data.action === "patchCaseStudy") {
        const id = event.data.payload?.id ?? firstId;
        const title = event.data.payload?.title;
        if (!id || title === undefined) return;
        patchCollectionItem("case-studies", id, { title });
        return;
      }

      if (event.data.action === "reorderHomepage") {
        const { fromIndex, toIndex } = event.data.payload ?? {};
        if (fromIndex === undefined || toIndex === undefined) return;
        const order = normalizeHomepageSectionOrder(
          live.settings?.homepage_section_order,
        );
        patchSettings({
          homepage_section_order: moveHomepageSection(order, fromIndex, toIndex),
        });
      }
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [patchCollectionItem, patchSettings]);

  return null;
}
