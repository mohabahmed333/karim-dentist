"use client";

import { useState } from "react";

export function useChairsideInspect() {
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);

  return {
    inspectorOpen,
    setInspectorOpen,
    builderOpen,
    setBuilderOpen,
    openInspector: () => setInspectorOpen(true),
    closeInspector: () => setInspectorOpen(false),
    closeBuilder: () => setBuilderOpen(false),
  };
}
