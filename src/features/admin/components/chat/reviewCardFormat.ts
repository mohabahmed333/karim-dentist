import { changedKeys } from "@/services/admin_ai/diff";

export type DiffFieldLine = { field: string; before: string; after: string };

const MAX_VALUE_CHARS = 80;

function formatValue(value: unknown, yes: string, no: string, empty: string): string {
  if (value === null || value === undefined || value === "") return empty;
  if (Array.isArray(value)) {
    return value.length ? value.map(String).join(", ").slice(0, MAX_VALUE_CHARS) : empty;
  }
  if (typeof value === "boolean") return value ? yes : no;
  return String(value).slice(0, MAX_VALUE_CHARS);
}

/**
 * Only the fields a proposal actually changes, staff-readable on both sides.
 *
 * The review card used to show only `diff.kind` and `diff.target` — a doctor
 * confirming a chart update had no way to see *what* would change before
 * tapping Confirm.
 */
export function diffFieldLines(
  diff: { before: Record<string, unknown>; after: Record<string, unknown> },
  labels: { yes: string; no: string; empty: string } = { yes: "Yes", no: "No", empty: "—" },
): DiffFieldLine[] {
  return changedKeys(diff.before, diff.after).map((field) => ({
    field,
    before: formatValue(diff.before[field], labels.yes, labels.no, labels.empty),
    after: formatValue(diff.after[field], labels.yes, labels.no, labels.empty),
  }));
}
