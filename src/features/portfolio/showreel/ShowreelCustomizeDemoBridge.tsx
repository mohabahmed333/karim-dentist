"use client";

import { useEffect, useRef } from "react";
import { useCustomize } from "@/features/customize/context/CustomizeContext";
import type { PortfolioData } from "@/services/portfolio";
import { applyShowreelCustomizeDemo } from "./applyShowreelCustomizeDemo";
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
  const { data, patchCollectionItem, patchSettings, patchHero } = useCustomize();
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
      applyShowreelCustomizeDemo(
        event.data,
        initialRef.current,
        dataRef.current,
        { patchCollectionItem, patchSettings, patchHero },
      );
    };
    window.addEventListener("message", onMessage);

    // Same-document counterpart to the postMessage path above: the in-iframe
    // customize cursor (SHOWREEL_CUSTOMIZE_CURSOR_STEPS) dispatches this
    // CustomEvent directly on arrival instead of round-tripping through the
    // parent window, so a patch is genuinely caused by the visible cursor
    // rather than landing on a blind timer.
    const onLocalDemo = (event: Event) => {
      const detail = (event as CustomEvent<unknown>).detail;
      if (!isDemoMessage(detail)) return;
      applyShowreelCustomizeDemo(
        detail,
        initialRef.current,
        dataRef.current,
        { patchCollectionItem, patchSettings, patchHero },
      );
    };
    window.addEventListener(SHOWREEL_CUSTOMIZE_DEMO, onLocalDemo);

    return () => {
      window.removeEventListener("message", onMessage);
      window.removeEventListener(SHOWREEL_CUSTOMIZE_DEMO, onLocalDemo);
    };
  }, [patchCollectionItem, patchHero, patchSettings]);

  return null;
}

export {
  SHOWREEL_CUSTOMIZE_UI_EVENT,
  type ShowreelCustomizeUiDetail,
} from "./showreelCustomizeUi";
