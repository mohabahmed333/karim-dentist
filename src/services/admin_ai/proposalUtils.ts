import { createHash } from "node:crypto";
import type { ProposedAction } from "./schemas";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`)
    .join(",")}}`;
}

/** Stable hash of current target snapshots so confirm can reject stale writes. */
export function snapshotHash(
  snapshots: Record<string, unknown>,
): string {
  return createHash("sha256").update(stableStringify(snapshots)).digest("hex");
}

export function proposalExpiresAt(from = new Date(), minutes = 30): Date {
  return new Date(from.getTime() + minutes * 60_000);
}

export function isProposalExpired(expiresAt: string | Date, now = new Date()) {
  const ts = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return ts.getTime() <= now.getTime();
}

/** Kahn-style topological sort; throws on cycles or missing deps. */
export function orderActions(actions: ProposedAction[]): ProposedAction[] {
  const byId = new Map(actions.map((a) => [a.id, a]));
  const indegree = new Map<string, number>();
  const children = new Map<string, string[]>();

  for (const action of actions) {
    indegree.set(action.id, indegree.get(action.id) ?? 0);
    for (const dep of action.dependsOn ?? []) {
      if (!byId.has(dep)) {
        throw new Error(`Missing dependency "${dep}" for action "${action.id}"`);
      }
      children.set(dep, [...(children.get(dep) ?? []), action.id]);
      indegree.set(action.id, (indegree.get(action.id) ?? 0) + 1);
    }
  }

  const queue = [...indegree.entries()]
    .filter(([, n]) => n === 0)
    .map(([id]) => id);
  const ordered: ProposedAction[] = [];

  while (queue.length > 0) {
    const id = queue.shift()!;
    ordered.push(byId.get(id)!);
    for (const child of children.get(id) ?? []) {
      const next = (indegree.get(child) ?? 1) - 1;
      indegree.set(child, next);
      if (next === 0) queue.push(child);
    }
  }

  if (ordered.length !== actions.length) {
    throw new Error("Circular action dependencies");
  }
  return ordered;
}
