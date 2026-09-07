"use client";

import { useLayoutEffect, useState, type RefObject } from "react";
import { measureLegacyAnchors, stageMeasureEqual, type StageMeasure } from "./stageMeasure";

export function useStageMeasure(
  container: RefObject<HTMLElement | null>,
  tick: unknown,
) {
  const [measured, setMeasured] = useState<StageMeasure>({
    rects: {},
    width: 0,
    height: 0,
  });

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;

    const update = () => {
      const next = measureLegacyAnchors(root);
      setMeasured((prev) => (stageMeasureEqual(prev, next) ? prev : next));
    };

    update();
    const frame = requestAnimationFrame(update);
    const delayed = window.setTimeout(update, 420);
    const observer = new ResizeObserver(update);
    observer.observe(root);
    root.querySelectorAll<HTMLElement>("[data-anchor]").forEach((node) => observer.observe(node));
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(delayed);
      observer.disconnect();
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [container, tick]);

  return measured;
}
