"use client";

import { useCallback } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PortfolioData } from "@/services/portfolio";
import type { FooterColumnKey } from "@/services/footer_links/types";
import type { CollectionSection } from "../types";
import { patchListItem } from "./dataHelpers";
import {
  applyFooterColumnReorderToIndex,
  applyReorder,
  applyReorderToIndex,
} from "./reorderHelpers";

type Enqueue = (key: string) => void;
type SetData = Dispatch<SetStateAction<PortfolioData>>;

/** Collection patch/reorder helpers for CustomizeProvider. */
export function useCollectionMutations(setData: SetData, enqueue: Enqueue) {
  const patchCollectionItem = useCallback(
    (
      section: CollectionSection,
      id: string,
      partial: Record<string, unknown>,
    ) => {
      setData((d) => patchListItem(d, section, id, partial));
      enqueue(`${section}:${id}`);
    },
    [enqueue, setData],
  );

  const reorderCollection = useCallback(
    (section: CollectionSection, id: string, direction: "up" | "down") => {
      setData((d) => applyReorder(d, section, id, direction, enqueue));
    },
    [enqueue, setData],
  );

  const reorderCollectionToIndex = useCallback(
    (section: CollectionSection, fromIndex: number, toIndex: number) => {
      setData((d) =>
        applyReorderToIndex(d, section, fromIndex, toIndex, enqueue),
      );
    },
    [enqueue, setData],
  );

  const reorderFooterColumnToIndex = useCallback(
    (columnKey: FooterColumnKey, fromIndex: number, toIndex: number) => {
      setData((d) =>
        applyFooterColumnReorderToIndex(
          d,
          columnKey,
          fromIndex,
          toIndex,
          enqueue,
        ),
      );
    },
    [enqueue, setData],
  );

  return {
    patchCollectionItem,
    reorderCollection,
    reorderCollectionToIndex,
    reorderFooterColumnToIndex,
  };
}
