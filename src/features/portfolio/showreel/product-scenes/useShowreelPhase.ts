"use client";

import { useEffect, useState } from "react";

/** Scripted showreel phase clock — timers only while active. */
export function useShowreelPhase<T extends string>(
  active: boolean,
  initial: T,
  steps: { id: T; at: number }[],
): T {
  const [phase, setPhase] = useState<T>(initial);
  const stepsKey = steps.map((s) => `${s.id}:${s.at}`).join("|");

  useEffect(() => {
    if (!active) return;
    const parsed = stepsKey.split("|").filter(Boolean).map((part) => {
      const [id, at] = part.split(":");
      return { id: id as T, at: Number(at) };
    });
    const timers = [
      window.setTimeout(() => setPhase(initial), 0),
      ...parsed.map(({ id, at }) => window.setTimeout(() => setPhase(id), at)),
    ];
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, initial, stepsKey]);

  return active ? phase : initial;
}
