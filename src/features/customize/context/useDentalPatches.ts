"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import type { Dispatch, SetStateAction } from "react";
import { toast } from "sonner";
import type { PortfolioData } from "@/services/portfolio";
import type {
  GalleryComparison,
  GalleryItem,
  GalleryShowcase,
  SolutionPanel,
  TrustItem,
} from "@/services/dental/types";
import {
  createGalleryComparison,
  deleteGalleryComparison,
} from "@/services/dental/mutations";
import { moveListToIndex } from "../lib/moveListToIndex";
import type { SaveStatus } from "../types";

type SetData = Dispatch<SetStateAction<PortfolioData>>;

function withComparisonOrders(list: GalleryComparison[]): GalleryComparison[] {
  return list.map((row, index) => ({ ...row, sort_order: index + 1 }));
}

function sortedComparisons(data: PortfolioData): GalleryComparison[] {
  return [...data.galleryComparisons].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
}

function enqueueComparisons(
  list: GalleryComparison[],
  enqueue: (key: string) => void,
) {
  for (const row of list) enqueue(`dental-comparison:${row.id}`);
}

export function useDentalPatches(
  data: PortfolioData,
  setData: SetData,
  enqueue: (key: string) => void,
  setSnapshot: SetData,
  setStatus: Dispatch<SetStateAction<SaveStatus>>,
) {
  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const patchTrustItem = useCallback(
    (id: string, partial: Partial<TrustItem>) => {
      setData((d) => ({
        ...d,
        trustItems: d.trustItems.map((item) =>
          item.id === id ? { ...item, ...partial } : item,
        ),
      }));
      enqueue(`dental-trust:${id}`);
    },
    [enqueue, setData],
  );

  const patchSolutionPanel = useCallback(
    (id: string, partial: Partial<SolutionPanel>) => {
      setData((d) => ({
        ...d,
        solutionPanels: d.solutionPanels.map((item) =>
          item.id === id ? { ...item, ...partial } : item,
        ),
      }));
      enqueue(`dental-panel:${id}`);
    },
    [enqueue, setData],
  );

  const patchGalleryItem = useCallback(
    (id: string, partial: Partial<GalleryItem>) => {
      setData((d) => ({
        ...d,
        galleryItems: d.galleryItems.map((item) =>
          item.id === id ? { ...item, ...partial } : item,
        ),
      }));
      enqueue(`dental-gallery:${id}`);
    },
    [enqueue, setData],
  );

  const patchGalleryShowcase = useCallback(
    (partial: Partial<GalleryShowcase>) => {
      setData((d) => ({
        ...d,
        galleryShowcase: d.galleryShowcase
          ? { ...d.galleryShowcase, ...partial }
          : d.galleryShowcase,
      }));
      enqueue("dental-showcase");
    },
    [enqueue, setData],
  );

  const patchGalleryComparison = useCallback(
    (id: string, partial: Partial<GalleryComparison>) => {
      setData((d) => ({
        ...d,
        galleryComparisons: d.galleryComparisons.map((item) =>
          item.id === id ? { ...item, ...partial } : item,
        ),
      }));
      enqueue(`dental-comparison:${id}`);
    },
    [enqueue, setData],
  );

  const addGalleryComparison = useCallback(async (): Promise<string | null> => {
    setStatus("saving");
    try {
      const sort_order =
        dataRef.current.galleryComparisons.reduce(
          (max, item) => Math.max(max, item.sort_order),
          -1,
        ) + 1;
      const row = await createGalleryComparison({ sort_order });
      setData((d) => ({
        ...d,
        galleryComparisons: [...d.galleryComparisons, row],
      }));
      setSnapshot((d) => ({
        ...d,
        galleryComparisons: [...d.galleryComparisons, row],
      }));
      setStatus("saved");
      return row.id;
    } catch (err) {
      setStatus("error");
      toast.error(err instanceof Error ? err.message : "Create failed");
      return null;
    }
  }, [setData, setSnapshot, setStatus]);

  const removeGalleryComparison = useCallback(
    async (id: string) => {
      setStatus("saving");
      try {
        await deleteGalleryComparison(id);
        setData((d) => ({
          ...d,
          galleryComparisons: d.galleryComparisons.filter((item) => item.id !== id),
        }));
        setSnapshot((d) => ({
          ...d,
          galleryComparisons: d.galleryComparisons.filter((item) => item.id !== id),
        }));
        setStatus("saved");
      } catch (err) {
        setStatus("error");
        toast.error(err instanceof Error ? err.message : "Delete failed");
      }
    },
    [setData, setSnapshot, setStatus],
  );

  const reorderGalleryComparison = useCallback(
    (id: string, direction: "up" | "down") => {
      setData((d) => {
        const list = sortedComparisons(d);
        const index = list.findIndex((item) => item.id === id);
        if (index < 0) return d;
        const swap = direction === "up" ? index - 1 : index + 1;
        if (swap < 0 || swap >= list.length) return d;
        const next = withComparisonOrders(moveListToIndex(list, index, swap));
        enqueueComparisons(next, enqueue);
        return { ...d, galleryComparisons: next };
      });
    },
    [enqueue, setData],
  );

  const reorderGalleryComparisonToIndex = useCallback(
    (fromIndex: number, toIndex: number) => {
      setData((d) => {
        const list = sortedComparisons(d);
        const moved = moveListToIndex(list, fromIndex, toIndex);
        if (moved === list) return d;
        const next = withComparisonOrders(moved);
        enqueueComparisons(next, enqueue);
        return { ...d, galleryComparisons: next };
      });
    },
    [enqueue, setData],
  );

  return useMemo(
    () => ({
      patchTrustItem,
      patchSolutionPanel,
      patchGalleryItem,
      patchGalleryShowcase,
      patchGalleryComparison,
      addGalleryComparison,
      removeGalleryComparison,
      reorderGalleryComparison,
      reorderGalleryComparisonToIndex,
    }),
    [
      addGalleryComparison,
      patchGalleryComparison,
      patchGalleryItem,
      patchGalleryShowcase,
      patchSolutionPanel,
      patchTrustItem,
      removeGalleryComparison,
      reorderGalleryComparison,
      reorderGalleryComparisonToIndex,
    ],
  );
}
