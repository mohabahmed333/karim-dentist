import { proposedActionSchema, type ProposedAction } from "./schemas";

export type ParsedProposedActions = {
  actions: ProposedAction[];
  /** How many entries were rejected — surface this rather than failing silently. */
  dropped: number;
};

/**
 * Validate a model-supplied `proposedActions` array item by item.
 *
 * Parsing the array as a whole (`z.array(schema).safeParse`) means one bad
 * entry discards every sibling, so a multi-tooth proposal with a single typo
 * silently becomes zero actions. Per-item parsing keeps the good ones and
 * drops only what is actually invalid — including unknown/injected kinds,
 * which `proposedActionSchema` rejects via its `kind` enum.
 */
export function parseProposedActions(input: unknown): ParsedProposedActions {
  if (!Array.isArray(input)) return { actions: [], dropped: 0 };

  const actions: ProposedAction[] = [];
  let dropped = 0;
  for (const entry of input) {
    const parsed = proposedActionSchema.safeParse(entry);
    if (parsed.success) actions.push(parsed.data);
    else dropped += 1;
  }
  return { actions, dropped };
}
