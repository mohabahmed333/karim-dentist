"use client";

import { useEffect, useState } from "react";
import {
  SHOWREEL_TITLE_CARD_MS,
  isFeatureDemoLive,
  isFeatureTitleCardVisible,
} from "./showreelTitleCard";

export function useShowreelFeatureTitleCard(active: boolean, playing: boolean) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!active || !playing) {
      setElapsedMs(0);
      return;
    }

    setElapsedMs(0);
    const started = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const next = now - started;
      setElapsedMs(next);
      if (next < SHOWREEL_TITLE_CARD_MS) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, playing]);

  const showTitleCard = isFeatureTitleCardVisible(active, playing, elapsedMs);
  const titleCardDone = !showTitleCard && active && playing;
  const demoLive = isFeatureDemoLive(active, playing, titleCardDone);

  return { showTitleCard, demoLive };
}
