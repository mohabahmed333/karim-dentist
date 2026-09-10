"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
};

/** useLayoutEffect warns during SSR; fall back to useEffect on the server. */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function ScrollReveal({
  children,
  className,
  direction = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Starts visible so the server-rendered HTML is readable without JS.
  // Googlebot executes JS, but GPTBot, ClaudeBot and PerplexityBot do not —
  // starting hidden served them a page whose copy was all opacity-0.
  // The animation is armed below in a layout effect, before first paint, so
  // what a human sees is unchanged.
  const [visible, setVisible] = useState(true);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion: never hide, never animate.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    setVisible(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const offset =
    direction === "left"
      ? "translate-x-6"
      : direction === "right"
        ? "-translate-x-6"
        : "translate-y-6";

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        // Belt-and-braces: even if the effect misfires, reduced-motion users
        // and no-JS readers get fully visible content.
        "motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        visible
          ? "translate-x-0 translate-y-0 opacity-100"
          : cn("opacity-0", offset),
        className,
      )}
    >
      {children}
    </div>
  );
}
