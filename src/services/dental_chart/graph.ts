import { TYPE_ANCHORS } from "./anchors";
import type { ConditionNode, DentalChart, NodeGraph } from "./types";

export function filterConditionStream(
  conditions: ConditionNode[],
  toothNumber: number | null,
): ConditionNode[] {
  return conditions.filter((node) => {
    if (!node.streamVisible || node.status === "RESOLVED") return false;
    if (toothNumber === null) return true;
    return node.toothNumber === toothNumber;
  });
}

export function cycleStream(
  nodes: ConditionNode[],
  currentId: string,
  dir: -1 | 1,
): string {
  if (nodes.length === 0) return currentId;
  const index = nodes.findIndex((node) => node.id === currentId);
  const from = index < 0 ? 0 : index;
  const next = (from + dir + nodes.length) % nodes.length;
  return nodes[next]?.id ?? currentId;
}

export function buildNodeGraph(
  chart: DentalChart,
  conditionId: string,
): NodeGraph | null {
  const condition = chart.conditions.find((node) => node.id === conditionId);
  if (!condition) return null;
  const encounters = chart.encounters.filter((item) =>
    item.conditionIds.includes(conditionId),
  );
  const media = chart.media.filter((item) =>
    encounters.some((encounter) => encounter.id === item.encounterId),
  );
  const notes = encounters
    .filter((item) => item.notes.trim().length > 0)
    .map((item) => item.notes);
  return {
    conditionId,
    toothNumber: condition.toothNumber,
    anchors: TYPE_ANCHORS[condition.type] ?? [],
    encounters,
    media,
    notes,
    vitalityIndex: condition.vitalityIndex,
  };
}
