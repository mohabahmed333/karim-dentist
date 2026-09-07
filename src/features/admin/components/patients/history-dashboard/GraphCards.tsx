"use client";

import { GraphWorkspace } from "./GraphWorkspace";
import type { GraphAnchor } from "@/services/dental_chart";
import type { HoveredEntity } from "./dashboard-interaction.types";
import type { RegisterNodeRef } from "./useNodeRefMap";

type Props = {
  visibleAnchors: GraphAnchor[];
  expanded: boolean;
  hoveredEntity: HoveredEntity;
  registerRef: RegisterNodeRef;
  onOpenCbct: () => void;
  onHoverCard: (id: string | null) => void;
};

export function GraphCards(props: Props) {
  return <GraphWorkspace {...props} />;
}
