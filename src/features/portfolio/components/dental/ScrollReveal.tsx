"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type ScrollRevealProps = {
  children: React.ReactNode;
  className?: string;
  direction?: "up" | "left" | "right";
};

export function ScrollReveal({
  children,
  className,
  direction = "up",
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
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
        visible ? "translate-x-0 translate-y-0 opacity-100" : cn("opacity-0", offset),
        className,
      )}
    >
      {children}
    </div>
  );
}
