import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { notificationTotal, visibleNotificationGroups } from "./groups.ts";

const all = new Set([
  "patients.billing.edit",
  "reservations.view",
  "inventory.view",
]);

describe("visibleNotificationGroups", () => {
  it("lists only what is waiting", () => {
    const groups = visibleNotificationGroups(
      { bills: 2, lowStock: 0, pendingBookings: 5 },
      all,
    );
    assert.deepEqual(
      groups.map((g) => g.key),
      ["bills", "pendingBookings"],
    );
  });

  it("withholds groups the user cannot act on", () => {
    const groups = visibleNotificationGroups(
      { bills: 3, lowStock: 4 },
      new Set(["inventory.view"]),
    );
    assert.deepEqual(
      groups.map((g) => g.key),
      ["lowStock"],
    );
  });

  it("is empty when nothing is waiting", () => {
    assert.deepEqual(visibleNotificationGroups({}, all), []);
    assert.deepEqual(
      visibleNotificationGroups({ bills: 0, overdue: 0 }, all),
      [],
    );
  });

  it("orders money before stock", () => {
    const groups = visibleNotificationGroups(
      { lowStock: 1, pendingBookings: 1, bills: 1, payments: 1, overdue: 1 },
      all,
    );
    assert.deepEqual(
      groups.map((g) => g.key),
      ["bills", "payments", "pendingBookings", "overdue", "lowStock"],
    );
  });

  it("totals what it shows, not what it hides", () => {
    const groups = visibleNotificationGroups(
      { bills: 2, lowStock: 7 },
      new Set(["patients.billing.edit"]),
    );
    assert.equal(notificationTotal(groups), 2);
  });
});
