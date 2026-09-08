import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  DASHBOARD_WIDGET_HEIGHT_ABS_MAX,
  DASHBOARD_WIDGET_HEIGHT_DEFAULT,
  DASHBOARD_WIDGET_HEIGHT_MIN,
  clampDashboardWidgetHeight,
  nextDashboardWidgetHeightFromDrag,
  parseDashboardWidgetHeight,
  viewportWidgetHeightMax,
} from "./dashboardWidgetHeight.ts";

test("clamps widget height between min and max", () => {
  assert.equal(clampDashboardWidgetHeight(40), DASHBOARD_WIDGET_HEIGHT_MIN);
  assert.equal(
    clampDashboardWidgetHeight(9000),
    DASHBOARD_WIDGET_HEIGHT_ABS_MAX,
  );
  assert.equal(
    clampDashboardWidgetHeight(DASHBOARD_WIDGET_HEIGHT_DEFAULT),
    DASHBOARD_WIDGET_HEIGHT_DEFAULT,
  );
});

test("respects a custom max (viewport)", () => {
  assert.equal(clampDashboardWidgetHeight(900, 800), 800);
  assert.equal(viewportWidgetHeightMax(1000), 984);
});

test("drag down grows height; drag up shrinks", () => {
  assert.equal(nextDashboardWidgetHeightFromDrag(280, 100, 140), 320);
  assert.equal(nextDashboardWidgetHeightFromDrag(280, 100, 60), 240);
  assert.equal(nextDashboardWidgetHeightFromDrag(280, 100, 900, 400), 400);
});

test("parse rejects non-finite values", () => {
  assert.equal(parseDashboardWidgetHeight(undefined), undefined);
  assert.equal(parseDashboardWidgetHeight("x"), undefined);
  assert.equal(parseDashboardWidgetHeight(200), 200);
});
