"use client";

import { useLayoutEffect } from "react";
import { runPortfolioMotion } from "../motion/runPortfolioMotion";

/** Mounts GSAP timelines on the public portfolio document root. */
export function PortfolioMotion() {
  useLayoutEffect(() => {
    return runPortfolioMotion(document.body);
  }, []);

  return null;
}
