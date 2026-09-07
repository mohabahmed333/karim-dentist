import type { ActionDiff, ActionKind, ProposedAction } from "./schemas";

export function buildDiff(input: {
  action: ProposedAction;
  target: string;
  before: Record<string, unknown>;
  after: Record<string, unknown>;
  warnings?: string[];
}): ActionDiff {
  return {
    actionId: input.action.id,
    kind: input.action.kind as ActionKind,
    target: input.target,
    before: input.before,
    after: input.after,
    warnings: input.warnings ?? [],
  };
}

/** Shallow field-level change summary for UI/audit. */
export function changedKeys(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
): string[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key) => before[key] !== after[key]);
}
