import assert from "node:assert/strict";
import test from "node:test";
import { matchFilterItems } from "./matchFilterItems.ts";

const items = [
  {
    id: "records",
    label: "Search records",
    keywords: ["name", "phone"],
  },
  {
    id: "status",
    label: "Status",
    keywords: ["Pending", "Confirmed", "All statuses"],
  },
  {
    id: "date",
    label: "Date",
    keywords: ["Today", "This Week"],
  },
  {
    id: "all",
    label: "All filters",
    keywords: [],
  },
];

test("empty query returns every menu item", () => {
  assert.deepEqual(matchFilterItems(items, "  "), items);
});

test("matches a field label case-insensitively", () => {
  const matched = matchFilterItems(items, "STAT");
  assert.deepEqual(
    matched.map((item) => item.id),
    ["status"],
  );
});

test("keeps a field when an option label matches", () => {
  const matched = matchFilterItems(items, "confirmed");
  assert.deepEqual(
    matched.map((item) => item.id),
    ["status"],
  );
});

test("hides items that do not match the query", () => {
  const matched = matchFilterItems(items, "records");
  assert.deepEqual(
    matched.map((item) => item.id),
    ["records"],
  );
});
