import { coerceSeverity } from "./alerts";
import { seedEncounters, seedLabs, seedMedia } from "./seed-encounters";
import { seedPrescriptions } from "./seed-rx";
import type { ConditionNode } from "./types";

export { seedEncounters, seedLabs, seedMedia, seedPrescriptions };

function node(
  id: string,
  tooth: number,
  type: ConditionNode["type"],
  extra: Partial<ConditionNode> = {},
): ConditionNode {
  const status = extra.status ?? "ACTIVE";
  return {
    id,
    toothNumber: tooth,
    type,
    status,
    streamVisible: extra.streamVisible ?? true,
    vitalityIndex: extra.vitalityIndex ?? null,
    severity: coerceSeverity(type, status, extra.severity ?? "MED"),
  };
}

export function seedConditions(): ConditionNode[] {
  const extras = Array.from({ length: 8 }, (_, index) =>
    node(`cond-14-finding-${index}`, 14, "PERIODONTITIS", {
      streamVisible: false,
      severity: "LOW",
    }),
  );
  return [
    node("cond-pulpitis", 1, "PULPITIS", { severity: "MED" }),
    node("cond-recession", 8, "GINGIVAL_RECESSION", { severity: "LOW" }),
    node("cond-fracture-8", 8, "TOOTH_FRACTURE", { severity: "HIGH" }),
    node("cond-chip-8", 8, "PULPITIS", { streamVisible: false, severity: "LOW" }),
    node("cond-perio", 19, "PERIODONTITIS", { severity: "MED" }),
    node("cond-implant", 19, "IMPLANT_DEGRADATION", { severity: "MED" }),
    node("cond-endo", 14, "ENDODONTIC_INFECTION", { vitalityIndex: 96 }),
    ...extras,
    node("cond-abscess", 30, "PERIAPICAL_ABSCESS", { severity: "HIGH" }),
    node("cond-abscess-monitor", 30, "PERIODONTITIS", {
      streamVisible: false,
      severity: "LOW",
    }),
  ];
}
