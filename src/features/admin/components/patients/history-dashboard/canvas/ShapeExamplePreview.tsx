"use client";

import { useMemo } from "react";
import type { CanvasNodeData } from "./canvas.types";
import { NodeShapeRegistry } from "./NodeShapeRegistry";
import { defaultDataForShape } from "./shapeRegistry";

type Props = {
  shapeType: string;
  title: string;
  data?: CanvasNodeData;
  scale?: number;
  compact?: boolean;
};

export function ShapeExamplePreview({
  shapeType,
  title,
  data,
  scale = 0.46,
  compact = false,
}: Props) {
  const previewData = useMemo(
    () => data ?? defaultDataForShape(shapeType),
    [data, shapeType],
  );

  return (
    <div
      className="pointer-events-none overflow-hidden"
      style={{
        height: compact ? 56 : 140,
        width: compact ? 80 : 200,
      }}
    >
      <div className="origin-top-left" style={{ transform: `scale(${scale})` }}>
        <NodeShapeRegistry
          node={{
            id: "shape-preview",
            x: 0,
            y: 0,
            shapeType,
            title,
            parentId: null,
            childrenIds: [],
            data: previewData,
          }}
        />
      </div>
    </div>
  );
}
