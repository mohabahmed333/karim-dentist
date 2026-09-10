"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import type { PortfolioData } from "@/services/portfolio";
import { isShowreelProductActivateMessage } from "../showreelProductActivate";
import { postShowreelEmbedReady } from "../showreelEmbedMessage";
import type { ShowreelProductScene } from "../showreelSlideTypes";

// Each scene is its own chunk. Statically importing all six meant the
// whatsapp iframe still downloaded ClinicDashboard, patients charting,
// support and the editor stack — and eight feature slides mount at once.
// ssr stays on so the scene's readiness marker is in the initial HTML.
const AiBookingScene = dynamic(() =>
  import("./AiBookingScene").then((m) => m.AiBookingScene),
);
const ClinicalAiScene = dynamic(() =>
  import("./ClinicalAiScene").then((m) => m.ClinicalAiScene),
);
const DashboardScene = dynamic(() =>
  import("./DashboardScene").then((m) => m.DashboardScene),
);
const SiteToChatScene = dynamic(() =>
  import("./SiteToChatScene").then((m) => m.SiteToChatScene),
);
const SmartUxScene = dynamic(() =>
  import("./SmartUxScene").then((m) => m.SmartUxScene),
);
const WhatsappScene = dynamic(() =>
  import("./WhatsappScene").then((m) => m.WhatsappScene),
);

type Props = {
  scene: ShowreelProductScene;
  siteData: PortfolioData;
};

export function ShowreelProductDemo({ scene, siteData }: Props) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    postShowreelEmbedReady("product");
    if (typeof window !== "undefined" && window.parent === window) {
      setActive(true);
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (!isShowreelProductActivateMessage(event.data)) return;
      if (event.data.scene !== scene) return;
      setActive(event.data.active);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [scene]);

  switch (scene) {
    case "ai-booking":
      return <AiBookingScene active={active} />;
    case "whatsapp":
      return <WhatsappScene active={active} />;
    case "clinical-ai":
      return <ClinicalAiScene active={active} />;
    case "smart-ux":
      return <SmartUxScene active={active} />;
    case "dashboard":
      return <DashboardScene active={active} />;
    case "site-to-chat":
      return <SiteToChatScene active={active} siteData={siteData} />;
    default:
      return <AiBookingScene active={active} />;
  }
}
