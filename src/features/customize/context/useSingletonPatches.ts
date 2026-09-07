"use client";

import { useCallback, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PortfolioData } from "@/services/portfolio";

type SetData = Dispatch<SetStateAction<PortfolioData>>;

export function useSingletonPatches(
  setData: SetData,
  enqueue: (key: string) => void,
) {
  const patchHero = useCallback(
    (partial: Partial<NonNullable<PortfolioData["hero"]>>) => {
      setData((d) => (d.hero ? { ...d, hero: { ...d.hero, ...partial } } : d));
      enqueue("hero");
    },
    [enqueue, setData],
  );

  const patchAbout = useCallback(
    (partial: Partial<NonNullable<PortfolioData["about"]>>) => {
      setData((d) => ({
        ...d,
        about: d.about ? { ...d.about, ...partial } : d.about,
      }));
      enqueue("about");
    },
    [enqueue, setData],
  );

  const patchCallout = useCallback(
    (partial: Partial<NonNullable<PortfolioData["callout"]>>) => {
      setData((d) =>
        d.callout ? { ...d, callout: { ...d.callout, ...partial } } : d,
      );
      enqueue("callout");
    },
    [enqueue, setData],
  );

  const patchSettings = useCallback(
    (partial: Partial<NonNullable<PortfolioData["settings"]>>) => {
      setData((d) => ({
        ...d,
        settings: d.settings ? { ...d.settings, ...partial } : d.settings,
      }));
      enqueue("settings");
    },
    [enqueue, setData],
  );

  return useMemo(
    () => ({ patchHero, patchAbout, patchCallout, patchSettings }),
    [patchHero, patchAbout, patchCallout, patchSettings],
  );
}
