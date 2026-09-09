"use client";

import { useEffect } from "react";
import { CUSTOMIZE_DEMO_SRC, SITE_DEMO_SRC } from "./showreelEmbedMessage";
import { prefetchShowreelBookingSlots } from "./showreelBookingSlotsPrefetch";

type Props = {
  prefetchVideo: boolean;
  prefetchCustomize: boolean;
  prefetchSite?: boolean;
  /** Warms /api/v1/booking/slots so the site-to-chat scene's BookingForm
      doesn't show a loading flash the moment it mounts. */
  prefetchBookingSlots?: boolean;
  videoDesktop?: string | null;
  videoMobile?: string | null;
};

function useBookingSlotsPrefetch(on = false) {
  useEffect(() => {
    if (!on) return;
    prefetchShowreelBookingSlots();
  }, [on]);
}

function usePreloadVideos(desktop?: string | null, mobile?: string | null, on = false) {
  useEffect(() => {
    if (!on) return;

    const hrefs = [...new Set([desktop, mobile].filter(Boolean))] as string[];
    const links = hrefs.map((href) => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "video";
      link.href = href;
      document.head.appendChild(link);
      return link;
    });

    const videos = hrefs.map((href) => {
      const video = document.createElement("video");
      video.preload = "auto";
      video.muted = true;
      video.playsInline = true;
      video.src = href;
      video.load();
      video.style.cssText =
        "position:absolute;width:0;height:0;opacity:0;pointer-events:none";
      document.body.appendChild(video);
      return video;
    });

    return () => {
      links.forEach((link) => link.remove());
      videos.forEach((video) => video.remove());
    };
  }, [desktop, mobile, on]);
}

/** Warm hero video + customize iframe + booking slots before they appear on screen. */
export function ShowreelPrefetch({
  prefetchVideo,
  prefetchCustomize,
  prefetchSite = false,
  prefetchBookingSlots = false,
  videoDesktop,
  videoMobile,
}: Props) {
  usePreloadVideos(videoDesktop, videoMobile, prefetchVideo);
  useBookingSlotsPrefetch(prefetchBookingSlots);

  if (!prefetchCustomize && !prefetchSite) return null;

  return (
    <div className="showreel-prefetch" aria-hidden>
      {prefetchSite ? <iframe title="" src={SITE_DEMO_SRC} tabIndex={-1} /> : null}
      {prefetchCustomize ? (
        <iframe title="" src={CUSTOMIZE_DEMO_SRC} tabIndex={-1} />
      ) : null}
    </div>
  );
}
