"use client";

import { useCallback, useEffect, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { PortfolioData } from "@/services/portfolio";
import {
  persistCaseStudySection,
  persistCaseStudySectionOrder,
} from "../lib/sectionPersistApi";
import {
  persistFeaturedSection,
  persistFeaturedSectionOrder,
} from "../lib/featuredSectionPersistApi";
import {
  persistCollectionItem,
  persistSingleton,
} from "../lib/persistApi";
import {
  persistGalleryComparison,
  persistGalleryItem,
  persistGalleryShowcase,
  persistSolutionPanel,
  persistTrustItem,
} from "../lib/persistDental";
import type { CollectionSection, SaveStatus } from "../types";
import { cloneData } from "./dataHelpers";

export function useFlushQueue(
  data: PortfolioData,
  setSnapshot: Dispatch<SetStateAction<PortfolioData>>,
  setStatus: Dispatch<SetStateAction<SaveStatus>>,
) {
  const dataRef = useRef(data);
  const pendingKeys = useRef(new Set<string>());

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const flush = useCallback(async () => {
    if (pendingKeys.current.size === 0) {
      setStatus("saved");
      return true;
    }
    setStatus("saving");
    const keys = [...pendingKeys.current];
    pendingKeys.current.clear();
    try {
      const current = dataRef.current;
      for (const key of keys) {
        if (
          key === "hero" ||
          key === "about" ||
          key === "callout" ||
          key === "settings"
        ) {
          await persistSingleton(key, current);
        } else if (key.startsWith("cs-section-order:")) {
          const caseStudyId = key.replace("cs-section-order:", "");
          await persistCaseStudySectionOrder(caseStudyId, current);
        } else if (key.startsWith("cs-section:")) {
          const [, caseStudyId, sectionId] = key.split(":");
          if (caseStudyId && sectionId && !sectionId.startsWith("temp-")) {
            await persistCaseStudySection(caseStudyId, sectionId, current);
          }
        } else if (key.startsWith("fp-section-order:")) {
          const featuredProjectId = key.replace("fp-section-order:", "");
          await persistFeaturedSectionOrder(featuredProjectId, current);
        } else if (key.startsWith("fp-section:")) {
          const [, featuredProjectId, sectionId] = key.split(":");
          if (featuredProjectId && sectionId && !sectionId.startsWith("temp-")) {
            await persistFeaturedSection(featuredProjectId, sectionId, current);
          }
        } else if (key.startsWith("dental-trust:")) {
          const id = key.replace("dental-trust:", "");
          await persistTrustItem(id, current);
        } else if (key.startsWith("dental-panel:")) {
          const id = key.replace("dental-panel:", "");
          await persistSolutionPanel(id, current);
        } else if (key.startsWith("dental-gallery:")) {
          const id = key.replace("dental-gallery:", "");
          await persistGalleryItem(id, current);
        } else if (key.startsWith("dental-comparison:")) {
          const id = key.replace("dental-comparison:", "");
          await persistGalleryComparison(id, current);
        } else if (key === "dental-showcase") {
          await persistGalleryShowcase(current);
        } else {
          const [section, id] = key.split(":") as [CollectionSection, string];
          await persistCollectionItem(section, id, current);
        }
      }
      setSnapshot(cloneData(dataRef.current));
      setStatus("saved");
      return true;
    } catch (err) {
      keys.forEach((k) => pendingKeys.current.add(k));
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Save failed");
      return false;
    }
  }, [setSnapshot, setStatus]);

  const enqueue = useCallback(
    (key: string) => {
      pendingKeys.current.add(key);
      setStatus("unsaved");
    },
    [setStatus],
  );

  const clearPending = useCallback(() => {
    pendingKeys.current.clear();
  }, []);

  const getPendingKeys = useCallback(() => [...pendingKeys.current], []);

  const replacePending = useCallback((keys: string[]) => {
    pendingKeys.current = new Set(keys);
  }, []);

  return { enqueue, flush, clearPending, getPendingKeys, replacePending };
}
