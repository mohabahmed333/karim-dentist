import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  DEFAULT_DASHBOARD_LAYOUT,
  addDashboardWidget,
  compatibleRowSpans,
  dropEdgeFromRatios,
  exactRowPartners,
  groupDashboardStacks,
  missingDashboardWidgets,
  moveDashboardWidget,
  normalizeDashboardLayout,
  placeDashboardWidget,
  placeDashboardWidgetBeside,
  appendToDashboardStack,
  moveToNewDashboardStack,
  packDashboardStackRows,
  placeInDashboardRowGap,
  removeDashboardWidget,
  resizeDashboardWidget,
  rowGapColSpan,
} from "./dashboardLayout.ts";

describe("dashboardLayout", () => {
  it("falls back to default for invalid input", () => {
    assert.deepEqual(normalizeDashboardLayout(null), DEFAULT_DASHBOARD_LAYOUT);
    assert.deepEqual(normalizeDashboardLayout([]), DEFAULT_DASHBOARD_LAYOUT);
    assert.deepEqual(normalizeDashboardLayout("x"), DEFAULT_DASHBOARD_LAYOUT);
  });

  it("preserves clamped heightPx on placements", () => {
    const layout = normalizeDashboardLayout([
      { id: "bookings", colSpan: 6, heightPx: 40 },
      { id: "recent", colSpan: 6, heightPx: 9000 },
    ]);
    assert.equal(layout[0]?.heightPx, 120);
    assert.equal(layout[1]?.heightPx, 5000);
  });

  it("keeps heightPx after rowId seeding and round-trip normalize", () => {
    const layout = normalizeDashboardLayout([
      { id: "daySchedule", colSpan: 12, heightPx: 640 },
      { id: "bookings", colSpan: 6, heightPx: 320 },
    ]);
    assert.equal(layout.find((w) => w.id === "daySchedule")?.heightPx, 640);
    assert.equal(layout.find((w) => w.id === "bookings")?.heightPx, 320);
    const again = normalizeDashboardLayout(layout);
    assert.equal(again.find((w) => w.id === "daySchedule")?.heightPx, 640);
  });

  it("does not share placement refs with the catalog default", () => {
    const layout = normalizeDashboardLayout(null);
    assert.notEqual(layout, DEFAULT_DASHBOARD_LAYOUT);
    assert.notEqual(layout[0], DEFAULT_DASHBOARD_LAYOUT[0]);
    const original = DEFAULT_DASHBOARD_LAYOUT[0]!.colSpan;
    layout[0]!.colSpan = original === 3 ? 4 : 3;
    assert.equal(DEFAULT_DASHBOARD_LAYOUT[0]!.colSpan, original);
  });

  it("dedupes ids and clamps colSpan", () => {
    const layout = normalizeDashboardLayout([
      { id: "kpiPending", colSpan: 12 },
      { id: "kpiPending", colSpan: 3 },
      { id: "bookings", colSpan: 99 },
      { id: "nope", colSpan: 12 },
    ]);
    assert.equal(layout.length, 2);
    assert.equal(layout[0]?.id, "kpiPending");
    assert.equal(layout[0]?.colSpan, 12);
    assert.equal(layout[1]?.id, "bookings");
    assert.ok([3, 4, 6, 8, 9, 12].includes(layout[1]!.colSpan));
  });

  it("moves, adds, removes, and resizes into free row space", () => {
    let layout = normalizeDashboardLayout([
      { id: "kpiPending", colSpan: 3 },
      { id: "bookings", colSpan: 3 },
    ]);
    layout = moveDashboardWidget(layout, 0, 1);
    assert.equal(layout[0]?.id, "bookings");
    layout = addDashboardWidget(layout, "messages");
    assert.ok(layout.some((w) => w.id === "messages"));
    layout = addDashboardWidget(layout, "messages");
    assert.equal(layout.filter((w) => w.id === "messages").length, 1);
    layout = resizeDashboardWidget(layout, "bookings", 6);
    assert.equal(layout.find((w) => w.id === "bookings")?.colSpan, 6);
    layout = removeDashboardWidget(layout, "kpiPending");
    assert.ok(!layout.some((w) => w.id === "kpiPending"));
    assert.ok(missingDashboardWidgets(layout).includes("kpiPending"));
  });

  it("places beside on the left", () => {
    const layout = placeDashboardWidgetBeside(
      [
        { id: "attentionPending", colSpan: 12 },
        { id: "kpiPending", colSpan: 12 },
        { id: "daySchedule", colSpan: 12 },
      ],
      0,
      1,
    );
    assert.deepEqual(
      layout.map((w) => ({ id: w.id, colSpan: w.colSpan })),
      [
        { id: "attentionPending", colSpan: 6 },
        { id: "kpiPending", colSpan: 6 },
        { id: "daySchedule", colSpan: 12 },
      ],
    );
    assert.equal(layout[0]?.rowId, layout[1]?.rowId);
    assert.notEqual(layout[0]?.rowId, layout[2]?.rowId);
  });

  it("stacks under a column keeping half width (two columns)", () => {
    const layout = placeDashboardWidget(
      [
        { id: "attentionPending", colSpan: 6 },
        { id: "kpiPending", colSpan: 6 },
        { id: "chartVisitsWeek", colSpan: 12 },
      ],
      2,
      0,
      "below",
    );
    assert.deepEqual(
      layout.map((w) => w.id),
      ["attentionPending", "chartVisitsWeek", "kpiPending"],
    );
    assert.equal(layout.find((w) => w.id === "chartVisitsWeek")?.colSpan, 6);
    assert.equal(
      layout.find((w) => w.id === "chartVisitsWeek")?.stackId,
      layout.find((w) => w.id === "attentionPending")?.stackId,
    );
    const stacks = groupDashboardStacks(layout);
    assert.deepEqual(
      stacks[0]?.widgets.map((w) => w.id),
      ["attentionPending", "chartVisitsWeek"],
    );
  });

  it("stacks under the right column of a two-column row", () => {
    const layout = placeDashboardWidget(
      [
        { id: "attentionPending", colSpan: 6 },
        { id: "kpiPending", colSpan: 6 },
        { id: "bookings", colSpan: 3 },
      ],
      2,
      1,
      "below",
    );
    assert.deepEqual(
      layout.map((w) => w.id),
      ["attentionPending", "kpiPending", "bookings"],
    );
    const bookings = layout.find((w) => w.id === "bookings")!;
    assert.equal(bookings.colSpan, 6);
    assert.equal(
      bookings.stackId,
      layout.find((w) => w.id === "kpiPending")?.stackId,
    );
  });

  it("places a widget above another in the same column", () => {
    const layout = placeDashboardWidget(
      [
        { id: "attentionPending", colSpan: 6 },
        { id: "kpiPending", colSpan: 6 },
        { id: "messages", colSpan: 3 },
      ],
      2,
      0,
      "above",
    );
    assert.equal(layout[0]?.id, "messages");
    assert.equal(layout[0]?.colSpan, 6);
    assert.equal(layout[0]?.stackId, layout[1]?.stackId);
  });

  it("refuses a wider size that would wrap neighbors onto a new row", () => {
    const layout = resizeDashboardWidget(
      [
        { id: "attentionPending", colSpan: 6, stackId: "left" },
        { id: "chartVisitsWeek", colSpan: 6, stackId: "left" },
        { id: "kpiPending", colSpan: 6 },
      ],
      "chartVisitsWeek",
      9,
    );
    assert.equal(layout[0]?.colSpan, 6);
    assert.equal(layout[1]?.colSpan, 6);
    assert.equal(layout[2]?.colSpan, 6);
    assert.equal(groupDashboardStacks(layout)[0]?.colSpan, 6);
    assert.equal(packDashboardStackRows(groupDashboardStacks(layout)).length, 1);
  });

  it("grows into trailing row gap without moving another stack", () => {
    const layout = resizeDashboardWidget(
      [
        { id: "attentionPending", colSpan: 6, stackId: "left" },
        { id: "chartVisitsWeek", colSpan: 6, stackId: "left" },
      ],
      "chartVisitsWeek",
      12,
    );
    assert.deepEqual(
      layout.map((w) => ({
        id: w.id,
        colSpan: w.colSpan,
        stackId: w.stackId,
      })),
      [
        {
          id: "attentionPending",
          colSpan: 12,
          stackId: "left",
        },
        {
          id: "chartVisitsWeek",
          colSpan: 12,
          stackId: "left",
        },
      ],
    );
  });

  it("keeps freed columns as row gap instead of pulling the next row up", () => {
    const layout = resizeDashboardWidget(
      [
        { id: "attentionPending", colSpan: 12, rowId: "r0" },
        { id: "bookings", colSpan: 6, rowId: "r1" },
      ],
      "attentionPending",
      6,
    );
    const rows = packDashboardStackRows(groupDashboardStacks(layout));
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.stacks.map((s) => s.widgets[0]?.id).join(","), "attentionPending");
    assert.equal(rows[0]?.gap, 6);
    assert.equal(rows[1]?.stacks.map((s) => s.widgets[0]?.id).join(","), "bookings");
    assert.equal(layout.find((w) => w.id === "attentionPending")?.colSpan, 6);
    assert.equal(layout.find((w) => w.id === "bookings")?.rowId, "r1");
  });

  it("can shrink and grow again into the same-row gap", () => {
    let layout = normalizeDashboardLayout([
      { id: "attentionPending", colSpan: 12, rowId: "r0" },
      { id: "kpiPending", colSpan: 3, rowId: "r1" },
    ]);
    layout = resizeDashboardWidget(layout, "attentionPending", 6);
    assert.equal(layout.find((w) => w.id === "attentionPending")?.colSpan, 6);
    assert.equal(packDashboardStackRows(groupDashboardStacks(layout)).length, 2);
    layout = resizeDashboardWidget(layout, "attentionPending", 9);
    assert.equal(layout.find((w) => w.id === "attentionPending")?.colSpan, 9);
    assert.equal(packDashboardStackRows(groupDashboardStacks(layout)).length, 2);
  });

  it("places on the right as 9+3", () => {
    const layout = placeDashboardWidget(
      [
        { id: "kpiPending", colSpan: 12 },
        { id: "recent", colSpan: 3 },
      ],
      0,
      1,
      "right",
    );
    assert.deepEqual(
      layout.map((w) => ({ id: w.id, colSpan: w.colSpan })),
      [
        { id: "recent", colSpan: 3 },
        { id: "kpiPending", colSpan: 9 },
      ],
    );
    assert.equal(layout[0]?.rowId, layout[1]?.rowId);
  });

  it("swaps same-row stacks left/right without changing widths", () => {
    const base = [
      { id: "chartVisitsWeek" as const, colSpan: 6 as const, rowId: "row-a" },
      { id: "chartBookingMix" as const, colSpan: 6 as const, rowId: "row-a" },
      { id: "bookings" as const, colSpan: 12 as const, rowId: "row-b" },
    ];
    const swapped = placeDashboardWidget(base, 0, 1, "right");
    assert.deepEqual(
      swapped.map((w) => ({ id: w.id, colSpan: w.colSpan })),
      [
        { id: "chartBookingMix", colSpan: 6 },
        { id: "chartVisitsWeek", colSpan: 6 },
        { id: "bookings", colSpan: 12 },
      ],
    );
    assert.equal(swapped[0]?.rowId, "row-a");
    assert.equal(swapped[1]?.rowId, "row-a");

    const back = placeDashboardWidget(swapped, 1, 0, "left");
    assert.deepEqual(
      back.map((w) => ({ id: w.id, colSpan: w.colSpan })),
      [
        { id: "chartVisitsWeek", colSpan: 6 },
        { id: "chartBookingMix", colSpan: 6 },
        { id: "bookings", colSpan: 12 },
      ],
    );
  });

  it("moves an entire stack when swapping beside a neighbor", () => {
    const base = [
      {
        id: "attentionPending" as const,
        colSpan: 6 as const,
        stackId: "left",
        rowId: "row-a",
      },
      {
        id: "chartVisitsWeek" as const,
        colSpan: 6 as const,
        stackId: "left",
        rowId: "row-a",
      },
      { id: "bookings" as const, colSpan: 6 as const, rowId: "row-a" },
    ];
    const swapped = placeDashboardWidget(base, 0, 2, "right");
    assert.deepEqual(
      swapped.map((w) => w.id),
      ["bookings", "attentionPending", "chartVisitsWeek"],
    );
    assert.equal(swapped.find((w) => w.id === "attentionPending")?.colSpan, 6);
    assert.equal(swapped.find((w) => w.id === "chartVisitsWeek")?.colSpan, 6);
    assert.equal(
      swapped.find((w) => w.id === "chartVisitsWeek")?.stackId,
      "left",
    );
  });

  it("appends into a stack empty footer", () => {
    const layout = appendToDashboardStack(
      [
        { id: "attentionPending", colSpan: 6, stackId: "left" },
        { id: "chartVisitsWeek", colSpan: 6, stackId: "left" },
        { id: "kpiPending", colSpan: 6 },
        { id: "bookings", colSpan: 12 },
      ],
      "bookings",
      "left",
    );
    assert.deepEqual(
      layout.map((w) => w.id),
      ["attentionPending", "chartVisitsWeek", "bookings", "kpiPending"],
    );
    assert.equal(layout.find((w) => w.id === "bookings")?.colSpan, 6);
    assert.equal(layout.find((w) => w.id === "bookings")?.stackId, "left");
  });

  it("moves a widget into a new end-of-grid stack", () => {
    const layout = moveToNewDashboardStack(
      [
        { id: "attentionPending", colSpan: 6, stackId: "left" },
        { id: "chartVisitsWeek", colSpan: 6, stackId: "left" },
        { id: "kpiPending", colSpan: 6 },
      ],
      "chartVisitsWeek",
      12,
    );
    assert.deepEqual(
      layout.map((w) => ({ id: w.id, colSpan: w.colSpan })),
      [
        { id: "attentionPending", colSpan: 6 },
        { id: "kpiPending", colSpan: 6 },
        { id: "chartVisitsWeek", colSpan: 12 },
      ],
    );
    assert.equal(layout.find((w) => w.id === "attentionPending")?.stackId, "left");
    assert.equal(layout.find((w) => w.id === "chartVisitsWeek")?.stackId, undefined);
  });

  it("packs row gaps and places into leftover columns", () => {
    assert.equal(rowGapColSpan(3), 3);
    assert.equal(rowGapColSpan(5), 4);
    assert.equal(rowGapColSpan(2), null);
    const stacks = groupDashboardStacks([
      { id: "attentionPending", colSpan: 9 },
      { id: "kpiPending", colSpan: 12 },
    ]);
    const rows = packDashboardStackRows(stacks);
    assert.equal(rows[0]?.gap, 3);
    assert.equal(rows[1]?.gap, 0);
    const layout = placeInDashboardRowGap(
      [
        { id: "attentionPending", colSpan: 9 },
        { id: "kpiPending", colSpan: 12 },
        { id: "messages", colSpan: 6 },
      ],
      "messages",
      stacks[0]!.id,
      3,
    );
    assert.deepEqual(
      layout.map((w) => ({ id: w.id, colSpan: w.colSpan })),
      [
        { id: "attentionPending", colSpan: 9 },
        { id: "messages", colSpan: 3 },
        { id: "kpiPending", colSpan: 12 },
      ],
    );
  });

  it("lists exact and compatible row partners", () => {
    assert.deepEqual(exactRowPartners(3), [9]);
    assert.deepEqual(exactRowPartners(4), [8]);
    assert.deepEqual(exactRowPartners(6), [6]);
    assert.deepEqual(exactRowPartners(9), [3]);
    assert.deepEqual(exactRowPartners(12), []);
    assert.ok(compatibleRowSpans(9).includes(3));
    assert.ok(!compatibleRowSpans(9).includes(6));
  });

  it("picks drop edge from pointer ratios", () => {
    assert.equal(dropEdgeFromRatios(0.5, 0.1), "above");
    assert.equal(dropEdgeFromRatios(0.5, 0.9), "below");
    assert.equal(dropEdgeFromRatios(0.2, 0.5), "left");
    assert.equal(dropEdgeFromRatios(0.8, 0.5), "right");
    // Tall-card center must not snap to left/right over below
    assert.equal(dropEdgeFromRatios(0.1, 0.85), "below");
    // Short KPI cards: prefer stack (above/below) over beside
    assert.equal(dropEdgeFromRatios(0.2, 0.5, 0.4), "above");
    assert.equal(dropEdgeFromRatios(0.8, 0.6, 0.4), "below");
    // Same-row swap: middle of card prefers left/right
    assert.equal(dropEdgeFromRatios(0.2, 0.5, 1, true), "left");
    assert.equal(dropEdgeFromRatios(0.8, 0.5, 1, true), "right");
  });

  it("expands legacy charts into individual cards", () => {
    const layout = normalizeDashboardLayout([
      { id: "charts", colSpan: 12 },
    ]);
    assert.deepEqual(
      layout.map((w) => w.id),
      [
        "chartVisitsWeek",
        "chartBookingMix",
        "chartStatus",
        "chartBusyHours",
        "chartDayTrend",
      ],
    );
    assert.equal(layout[0]?.colSpan, 6);
    assert.equal(layout[4]?.colSpan, 12);
  });

  it("expands legacy attention/kpis into individual cards", () => {
    const layout = normalizeDashboardLayout([
      { id: "attention", colSpan: 12 },
      { id: "kpis", colSpan: 12 },
    ]);
    assert.deepEqual(
      layout.map((w) => w.id),
      [
        "attentionPending",
        "attentionToday",
        "kpiTodayVisits",
        "kpiPending",
        "kpiConfirmedWeek",
        "kpiServices",
      ],
    );
    assert.ok(layout.every((w) => w.colSpan === 3));
  });

  it("normalizes colSpan 9", () => {
    const layout = normalizeDashboardLayout([
      { id: "daySchedule", colSpan: 9 },
      { id: "messages", colSpan: 3 },
    ]);
    assert.equal(layout[0]?.colSpan, 9);
    assert.equal(layout[1]?.colSpan, 3);
  });
});
