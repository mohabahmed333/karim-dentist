import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addDashboardWidget,
  missingDashboardWidgets,
  normalizeDashboardLayout,
} from "./dashboardLayout";
import type { DashboardCatalog, DashboardWidgetMeta } from "./dashboardCatalog";

const STUB_META: Record<string, DashboardWidgetMeta> = {
  a: { id: "a", labelKey: "admin.overview.customize.sizeFull", defaultColSpan: 6, allowedColSpans: [3, 6, 12] },
  b: { id: "b", labelKey: "admin.overview.customize.sizeFull", defaultColSpan: 3, allowedColSpans: [3, 6, 12] },
};

const STUB_CATALOG: DashboardCatalog = {
  ids: ["a", "b"],
  meta: (id) => STUB_META[id]!,
  defaultLayout: [{ id: "a", colSpan: 6 }],
};

describe("normalizeDashboardLayout", () => {
  it("falls back to the catalog's default layout for invalid input", () => {
    const layout = normalizeDashboardLayout(null, STUB_CATALOG);
    assert.deepEqual(layout.map((w) => w.id), ["a"]);
  });

  it("drops ids not in the catalog", () => {
    const layout = normalizeDashboardLayout(
      [{ id: "a", colSpan: 6 }, { id: "unknown-widget", colSpan: 3 }],
      STUB_CATALOG,
    );
    assert.deepEqual(layout.map((w) => w.id), ["a"]);
  });

  it("clamps colSpan to the widget's allowed spans", () => {
    const layout = normalizeDashboardLayout(
      [{ id: "b", colSpan: 4 }],
      STUB_CATALOG,
    );
    assert.equal(layout[0]!.colSpan, 3);
  });
});

describe("missingDashboardWidgets", () => {
  it("lists catalog ids not present in the layout", () => {
    const missing = missingDashboardWidgets([{ id: "a", colSpan: 6 }], STUB_CATALOG);
    assert.deepEqual(missing, ["b"]);
  });

  it("excludes hidden ids", () => {
    const missing = missingDashboardWidgets([], STUB_CATALOG, ["b"]);
    assert.deepEqual(missing, ["a"]);
  });
});

describe("addDashboardWidget", () => {
  it("appends the widget at its catalog default colSpan", () => {
    const layout = addDashboardWidget([], "b", STUB_CATALOG);
    assert.equal(layout.length, 1);
    assert.equal(layout[0]!.id, "b");
    assert.equal(layout[0]!.colSpan, 3);
  });

  it("is a no-op if the widget is already present", () => {
    const layout = addDashboardWidget([{ id: "a", colSpan: 6, rowId: "r" }], "a", STUB_CATALOG);
    assert.equal(layout.length, 1);
  });
});
