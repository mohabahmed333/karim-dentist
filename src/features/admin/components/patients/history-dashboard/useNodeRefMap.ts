"use client";

import { useCallback, useRef } from "react";

export type NodeRefMap = React.MutableRefObject<Record<string, HTMLElement | null>>;

export function useNodeRefMap() {
  const nodeRefs = useRef<Record<string, HTMLElement | null>>({});

  const setNodeRef = useCallback(
    (id: string) => (element: HTMLElement | null) => {
      nodeRefs.current[id] = element;
    },
    [],
  );

  const clearNodeRefs = useCallback(() => {
    nodeRefs.current = {};
  }, []);

  return { nodeRefs, setNodeRef, clearNodeRefs };
}

export type RegisterNodeRef = ReturnType<typeof useNodeRefMap>["setNodeRef"];
