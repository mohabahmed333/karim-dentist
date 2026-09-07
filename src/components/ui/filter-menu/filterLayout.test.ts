import assert from "node:assert/strict";
import test from "node:test";
import {
  moveField,
  parseFilterLayout,
  resolveVisibleFieldIds,
  toggleFieldEnabled,
} from "./filterLayout.ts";

const available = ["date", "status", "service"];

test("defaults to every available field in given order", () => {
  assert.deepEqual(resolveVisibleFieldIds(available, null), available);
});

test("hides fields the user unchecked", () => {
  const layout = {
    order: available,
    enabled: { date: true, status: false, service: true },
  };
  assert.deepEqual(resolveVisibleFieldIds(available, layout), [
    "date",
    "service",
  ]);
});

test("reorders visible fields from stored order", () => {
  const layout = {
    order: ["service", "date", "status"],
    enabled: { date: true, status: true, service: true },
  };
  assert.deepEqual(resolveVisibleFieldIds(available, layout), [
    "service",
    "date",
    "status",
  ]);
});

test("appends newly available fields at the end", () => {
  const layout = {
    order: ["status"],
    enabled: { status: true },
  };
  assert.deepEqual(resolveVisibleFieldIds(available, layout), [
    "status",
    "date",
    "service",
  ]);
});

test("toggleFieldEnabled flips a field and keeps the rest", () => {
  const layout = {
    order: available,
    enabled: { date: true, status: true, service: true },
  };
  const next = toggleFieldEnabled(layout, "status");
  assert.equal(next.enabled.status, false);
  assert.equal(next.enabled.date, true);
});

test("moveField relocates an id in order", () => {
  assert.deepEqual(moveField(["date", "status", "service"], 0, 2), [
    "status",
    "service",
    "date",
  ]);
});

test("parseFilterLayout returns null for invalid json", () => {
  assert.equal(parseFilterLayout("nope"), null);
  assert.equal(parseFilterLayout(null), null);
});
