"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { PortfolioData } from "@/services/portfolio";
import type { SaveStatus } from "../types";
import {
  CustomizeActionsContext,
  CustomizeDataContext,
  CustomizeStatusContext,
} from "./CustomizeContext";
import { cloneData } from "./dataHelpers";
import { useCaseStudySectionActions } from "./useCaseStudySectionActions";
import { useFeaturedSectionActions } from "./useFeaturedSectionActions";
import { useCollectionActions } from "./useCollectionActions";
import { useCollectionMutations } from "./useCollectionMutations";
import { useDentalPatches } from "./useDentalPatches";
import { useEditHistory } from "./useEditHistory";
import { useFlushQueue } from "./useFlushQueue";
import { useSingletonPatches } from "./useSingletonPatches";

type Props = { initial: PortfolioData; children: React.ReactNode };

export function CustomizeProvider({ initial, children }: Props) {
  const [data, setData] = useState(() => cloneData(initial));
  const [snapshot, setSnapshot] = useState(() => cloneData(initial));
  const [status, setStatus] = useState<SaveStatus>("saved");
  const historyResetRef = useRef<(baseline: PortfolioData) => void>(() => {});

  const setSnapshotTracked = useCallback<
    Dispatch<SetStateAction<PortfolioData>>
  >((action) => {
    setSnapshot((prev) => {
      const next =
        typeof action === "function"
          ? (action as (value: PortfolioData) => PortfolioData)(prev)
          : action;
      queueMicrotask(() => historyResetRef.current(cloneData(next)));
      return next;
    });
  }, []);

  const { enqueue, flush, clearPending, getPendingKeys, replacePending } =
    useFlushQueue(data, setSnapshotTracked, setStatus);

  const history = useEditHistory({
    data,
    status,
    getPendingKeys,
    replacePending,
    setData: (next) => setData(next),
    setStatus,
  });
  historyResetRef.current = history.reset;

  const singletons = useSingletonPatches(setData, enqueue);
  const dental = useDentalPatches(
    data,
    setData,
    enqueue,
    setSnapshotTracked,
    setStatus,
  );
  const collections = useCollectionActions(
    data,
    setData,
    setSnapshotTracked,
    setStatus,
  );
  const mutations = useCollectionMutations(setData, enqueue);
  const sectionActions = useCaseStudySectionActions(
    data,
    setData,
    enqueue,
    setStatus,
    setSnapshotTracked,
  );
  const featuredSectionActions = useFeaturedSectionActions(
    data,
    setData,
    enqueue,
    setStatus,
    setSnapshotTracked,
  );

  const saveNow = useCallback(async () => flush(), [flush]);
  const discard = useCallback(() => {
    clearPending();
    const baseline = cloneData(snapshot);
    setData(baseline);
    setStatus("saved");
    history.reset(baseline);
  }, [clearPending, history.reset, snapshot]);

  const actions = useMemo(
    () => ({
      ...singletons,
      ...dental,
      ...sectionActions,
      ...featuredSectionActions,
      ...mutations,
      addCollectionItem: collections.add,
      addFooterLink: collections.addFooterLink,
      removeCollectionItem: collections.remove,
      saveNow,
      discard,
      undo: history.undo,
      redo: history.redo,
      canUndo: history.canUndo,
      canRedo: history.canRedo,
    }),
    [
      singletons,
      dental,
      sectionActions,
      featuredSectionActions,
      mutations,
      collections.add,
      collections.addFooterLink,
      collections.remove,
      saveNow,
      discard,
      history.undo,
      history.redo,
      history.canUndo,
      history.canRedo,
    ],
  );

  return (
    <CustomizeActionsContext.Provider value={actions}>
      <CustomizeDataContext.Provider value={data}>
        <CustomizeStatusContext.Provider value={status}>
          {children}
        </CustomizeStatusContext.Provider>
      </CustomizeDataContext.Provider>
    </CustomizeActionsContext.Provider>
  );
}
