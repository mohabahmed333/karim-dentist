import type { ConditionNode, ToothData } from "./types";
import type { ConditionType, Severity } from "./enums";

const CRITICAL_TYPES: ConditionType[] = [
  "ENDODONTIC_INFECTION",
  "PERIAPICAL_ABSCESS",
];

export function isCriticalType(type: ConditionType): boolean {
  return CRITICAL_TYPES.includes(type);
}

export function coerceSeverity(
  type: ConditionType,
  status: ConditionNode["status"],
  requested: Severity,
): Severity {
  if (status === "ACTIVE" && isCriticalType(type)) return "CRITICAL";
  return requested;
}

export function activeAlertCount(conditions: ConditionNode[]): number {
  return conditions.filter((item) => item.status === "ACTIVE").length;
}

export function toothGlows(conditions: ConditionNode[]): boolean {
  return conditions.some(
    (item) => item.status === "ACTIVE" && item.severity === "CRITICAL",
  );
}

export function withToothAlerts(tooth: ToothData): ToothData {
  const conditions = tooth.conditions.map((node) => ({
    ...node,
    severity: coerceSeverity(node.type, node.status, node.severity),
  }));
  return {
    ...tooth,
    conditions,
    activeAlertCount: activeAlertCount(conditions),
    glowing: toothGlows(conditions),
  };
}
