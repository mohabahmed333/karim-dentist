"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import {
  useCustomizeActions,
  useCustomizeData,
} from "../context/CustomizeContext";
import {
  cmsTranslateSelectionLabel,
  collectCmsTranslateJobs,
  sourceForDirection,
  type CmsTranslateSelection,
  type TranslateDirection,
} from "../lib/collectCmsTranslateJobs";
import { translateText } from "../lib/translateText";

export type TranslateProgress = {
  done: number;
  total: number;
  direction: TranslateDirection;
  selection: CmsTranslateSelection;
};

type CmsTranslateValue = {
  isTranslating: boolean;
  progress: TranslateProgress | null;
  translate: (
    direction: TranslateDirection,
    selection: CmsTranslateSelection,
  ) => Promise<void>;
};

const CmsTranslateContext = createContext<CmsTranslateValue | null>(null);

export function CmsTranslateProvider({ children }: { children: ReactNode }) {
  const data = useCustomizeData();
  const {
    patchHero,
    patchAbout,
    patchCallout,
    patchSettings,
    patchTrustItem,
    patchSolutionPanel,
    patchGalleryItem,
    patchCollectionItem,
    patchCaseStudySection,
    patchFeaturedSection,
  } = useCustomizeActions();
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState<TranslateProgress | null>(null);
  const busyRef = useRef(false);

  const translate = useCallback(
    async (direction: TranslateDirection, selection: CmsTranslateSelection) => {
      if (busyRef.current) return;
      if (selection !== "all" && selection.length === 0) {
        toast.message("Select at least one module to translate");
        return;
      }

      const jobs = collectCmsTranslateJobs(
        data,
        direction,
        {
          patchHero,
          patchAbout,
          patchCallout,
          patchSettings,
          patchTrustItem,
          patchSolutionPanel,
          patchGalleryItem,
          patchCollectionItem,
          patchCaseStudySection,
          patchFeaturedSection,
        },
        selection,
      );

      const label = cmsTranslateSelectionLabel(selection);
      if (!jobs.length) {
        toast.message(
          direction === "to-ar"
            ? `No English copy to translate (${label})`
            : `No Arabic copy to translate (${label})`,
        );
        return;
      }

      busyRef.current = true;
      setIsTranslating(true);
      setProgress({ done: 0, total: jobs.length, direction, selection });
      const source = sourceForDirection(direction);
      let ok = 0;
      let failed = 0;

      try {
        for (let index = 0; index < jobs.length; index += 1) {
          const job = jobs[index];
          if (!job) continue;
          try {
            const result = await translateText(job.text, source);
            if (!result) failed += 1;
            else {
              job.apply(result);
              ok += 1;
            }
          } catch {
            failed += 1;
          }
          setProgress({
            done: index + 1,
            total: jobs.length,
            direction,
            selection,
          });
        }

        if (ok > 0 && failed === 0) {
          toast.success(
            direction === "to-ar"
              ? `Translated ${ok} field${ok === 1 ? "" : "s"} to Arabic (${label})`
              : `Translated ${ok} field${ok === 1 ? "" : "s"} to English (${label})`,
          );
        } else if (ok > 0) {
          toast.success(`Translated ${ok}, ${failed} failed (${label})`);
        } else {
          toast.error("Translation failed");
        }
      } finally {
        busyRef.current = false;
        setIsTranslating(false);
        setProgress(null);
      }
    },
    [
      data,
      patchAbout,
      patchCallout,
      patchCaseStudySection,
      patchCollectionItem,
      patchFeaturedSection,
      patchGalleryItem,
      patchHero,
      patchSettings,
      patchSolutionPanel,
      patchTrustItem,
    ],
  );

  const value = useMemo(
    () => ({ isTranslating, progress, translate }),
    [isTranslating, progress, translate],
  );

  return (
    <CmsTranslateContext.Provider value={value}>
      {children}
    </CmsTranslateContext.Provider>
  );
}

export function useCmsTranslate() {
  const value = useContext(CmsTranslateContext);
  if (!value) {
    throw new Error("useCmsTranslate must be used within CmsTranslateProvider");
  }
  return value;
}
