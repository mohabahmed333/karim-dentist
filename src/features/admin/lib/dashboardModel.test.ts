import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildBillingInventoryKpis } from "./dashboardModel";

describe("buildBillingInventoryKpis", () => {
  it("returns no entries when nothing is visible to the viewer", () => {
    const kpis = buildBillingInventoryKpis({
      outstandingBalance: null,
      pendingPaymentsCount: null,
      lowStockCount: null,
      pendingApprovalsCount: null,
    });
    assert.deepEqual(kpis, []);
  });

  it("formats visible values and flags non-zero counts as needing attention", () => {
    const kpis = buildBillingInventoryKpis({
      outstandingBalance: 1234.6,
      pendingPaymentsCount: 2,
      lowStockCount: 0,
      pendingApprovalsCount: 1,
    });
    assert.equal(kpis.length, 4);
    assert.equal(kpis[0]!.labelKey, "admin.overview.kpi.outstandingBalance");
    assert.match(kpis[0]!.value, /^1,?235 EGP$/);
    assert.equal(kpis[0]!.trend, "—");
    assert.equal(kpis[0]!.up, true);
    assert.deepEqual(kpis.slice(1), [
      { labelKey: "admin.overview.kpi.pendingPayments", value: "2", trend: "—", up: false },
      { labelKey: "admin.overview.kpi.lowStock", value: "0", trend: "—", up: true },
      { labelKey: "admin.overview.kpi.pendingApprovals", value: "1", trend: "—", up: false },
    ]);
  });

  it("includes only the fields the viewer has permission for", () => {
    const kpis = buildBillingInventoryKpis({
      outstandingBalance: 500,
      pendingPaymentsCount: null,
      lowStockCount: null,
      pendingApprovalsCount: null,
    });
    assert.equal(kpis.length, 1);
    assert.equal(kpis[0]!.labelKey, "admin.overview.kpi.outstandingBalance");
  });
});
