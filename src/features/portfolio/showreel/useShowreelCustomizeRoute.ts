"use client";

import { useEffect, type RefObject } from "react";
import {
  parseShowreelDemoParams,
  postShowreelCustomizeRoute,
} from "./showreelEmbedMessage";

/** Keep the customize iframe route in sync with the active feature slide. */
export function useShowreelCustomizeRoute(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  desktopSrc: string,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    postShowreelCustomizeRoute(
      iframeRef.current,
      parseShowreelDemoParams(desktopSrc),
    );
  }, [desktopSrc, enabled, iframeRef]);
}
