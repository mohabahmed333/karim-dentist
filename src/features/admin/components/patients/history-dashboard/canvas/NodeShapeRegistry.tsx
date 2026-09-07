"use client";

import type { CanvasNode } from "./canvas.types";
import { isSchemaShape } from "./shapeRegistry";
import { DiagnosticPillNode } from "./nodes/DiagnosticPillNode";
import { LabPipelineNode } from "./nodes/LabPipelineNode";
import { MediaQuadrantNode } from "./nodes/MediaQuadrantNode";
import { MetricBentoNode } from "./nodes/MetricBentoNode";
import { PerioProbingNode } from "./nodes/PerioProbingNode";
import { PrescriptionListNode } from "./nodes/PrescriptionListNode";
import { SchemaShapeNode } from "./nodes/SchemaShapeNode";
import { SourceConditionNode } from "./nodes/SourceConditionNode";
import { StackedDocumentNode } from "./nodes/StackedDocumentNode";

type Props = {
  node: CanvasNode;
  onOpenCbct?: () => void;
};

export function NodeShapeRegistry({ node, onOpenCbct }: Props) {
  const { shapeType, title, data } = node;

  if (shapeType === "SHAPE_01") return <SourceConditionNode title={title} />;
  if (shapeType === "SHAPE_02") {
    return <MetricBentoNode title={title} metric={data?.metric} />;
  }
  if (shapeType === "SHAPE_03") {
    return <MediaQuadrantNode title={title} mediaFiles={data?.mediaFiles} onOpen={onOpenCbct} />;
  }
  if (shapeType === "SHAPE_04") return <StackedDocumentNode />;
  if (shapeType === "SHAPE_05") {
    return <DiagnosticPillNode title={title} date={data?.date} />;
  }
  if (shapeType === "SHAPE_06") {
    return <PerioProbingNode title={title} schema={data?.schema} />;
  }
  if (shapeType === "SHAPE_07") {
    return <LabPipelineNode title={title} progressPercent={data?.progressPercent} />;
  }
  if (shapeType === "SHAPE_08") {
    return <PrescriptionListNode title={title} drugs={data?.drugs} />;
  }
  if (isSchemaShape(shapeType) && data?.schema) {
    return <SchemaShapeNode schema={data.schema} title={title} />;
  }

  return (
    <SchemaShapeNode
      title={title}
      schema={data?.schema ?? { header: title, footerBadge: shapeType, theme: "light" }}
    />
  );
}
