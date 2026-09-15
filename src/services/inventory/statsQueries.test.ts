import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateStockValueByCategory,
  buildReorderSuggestions,
  countItemsBelowThreshold,
  daysUntil,
} from "./statsQueries";

describe("aggregateStockValueByCategory", () => {
  it("sums qty_remaining * unit_cost_egp per category, highest first", () => {
    const rows = [
      { qty_remaining: 10, unit_cost_egp: 5, item: { category: "disposable" } },
      { qty_remaining: 2, unit_cost_egp: 100, item: { category: "implant" } },
      { qty_remaining: 4, unit_cost_egp: 5, item: { category: "disposable" } },
    ];
    const result = aggregateStockValueByCategory(rows);
    assert.deepEqual(result, [
      { category: "implant", value: 200 },
      { category: "disposable", value: 70 },
    ]);
  });

  it("falls back to 'general' when the item join is missing", () => {
    const result = aggregateStockValueByCategory([
      { qty_remaining: 3, unit_cost_egp: 10, item: null },
    ]);
    assert.deepEqual(result, [{ category: "general", value: 30 }]);
  });

  it("drops zero-value categories and returns an empty list for no rows", () => {
    assert.deepEqual(aggregateStockValueByCategory([]), []);
    assert.deepEqual(
      aggregateStockValueByCategory([{ qty_remaining: 0, unit_cost_egp: 10, item: { category: "ppe" } }]),
      [],
    );
  });
});

describe("countItemsBelowThreshold", () => {
  it("counts items whose on-hand quantity is at or below their minimum", () => {
    const items = [
      { id: "a", min_stock_level: 10 },
      { id: "b", min_stock_level: 5 },
      { id: "c", min_stock_level: 0 },
    ];
    const batches = [
      { item_id: "a", qty_remaining: 4 },
      { item_id: "a", qty_remaining: 2 },
      { item_id: "b", qty_remaining: 20 },
    ];
    assert.equal(countItemsBelowThreshold(items, batches), 1);
  });

  it("ignores items with no minimum stock level set", () => {
    assert.equal(
      countItemsBelowThreshold([{ id: "a", min_stock_level: 0 }], []),
      0,
    );
  });

  it("treats an item with no batches at all as zero on hand", () => {
    assert.equal(
      countItemsBelowThreshold([{ id: "a", min_stock_level: 1 }], []),
      1,
    );
  });
});

describe("daysUntil", () => {
  it("counts whole days between two dates", () => {
    const now = new Date("2026-09-15T12:00:00.000Z");
    assert.equal(daysUntil("2026-09-20T00:00:00.000Z", now), 4);
  });

  it("returns 0 for a date in the past", () => {
    const now = new Date("2026-09-15T12:00:00.000Z");
    assert.equal(daysUntil("2026-09-10T00:00:00.000Z", now), 0);
  });
});

describe("buildReorderSuggestions", () => {
  it("suggests items at or below their minimum stock level", () => {
    const items = [
      {
        id: "item-1",
        name: "Gauze",
        name_ar: "شاش",
        min_stock_level: 10,
        reorder_qty: 50,
        default_supplier: { name: "MedSupply" },
      },
      {
        id: "item-2",
        name: "Gloves",
        name_ar: "قفازات",
        min_stock_level: 5,
        reorder_qty: 20,
        default_supplier: null,
      },
    ];
    const batches = [
      { item_id: "item-1", qty_remaining: 4 },
      { item_id: "item-1", qty_remaining: 2 },
      { item_id: "item-2", qty_remaining: 20 },
    ];
    const suggestions = buildReorderSuggestions(items, batches);
    assert.deepEqual(suggestions, [
      {
        itemId: "item-1",
        itemName: "Gauze",
        itemNameAr: "شاش",
        qtyOnHand: 6,
        minStockLevel: 10,
        reorderQty: 50,
        supplierName: "MedSupply",
      },
    ]);
  });

  it("treats an item with no batches as zero on hand", () => {
    const items = [
      {
        id: "item-1",
        name: "Gauze",
        name_ar: "شاش",
        min_stock_level: 1,
        reorder_qty: 10,
        default_supplier: null,
      },
    ];
    const suggestions = buildReorderSuggestions(items, []);
    assert.equal(suggestions.length, 1);
    assert.equal(suggestions[0]!.supplierName, null);
  });

  it("ignores items with no minimum stock level set", () => {
    const items = [
      { id: "item-1", name: "Gauze", name_ar: "شاش", min_stock_level: 0, reorder_qty: 10, default_supplier: null },
    ];
    assert.deepEqual(buildReorderSuggestions(items, []), []);
  });
});
