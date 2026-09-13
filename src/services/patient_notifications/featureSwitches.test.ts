import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  SWITCHABLE_FEATURES,
  featureForKind,
  isFeatureOn,
  isKindOn,
  loadFeatureSwitches,
  setFeatureSwitch,
} from "./featureSwitches.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { createFakeDb } from "@/services/admin_ai/testing/fakeDb.ts";

describe("featureForKind", () => {
  it("maps every outbox kind the dispatcher sends", () => {
    assert.equal(featureForKind("confirmation"), "confirmations");
    assert.equal(featureForKind("reminder_24h"), "reminders");
    assert.equal(featureForKind("waitlist_offer"), "waitlist");
    assert.equal(featureForKind("recall_6m"), "recalls");
    assert.equal(featureForKind("review_request"), "reviews");
  });

  it("is null for a kind nobody mapped", () => {
    // Better unswitchable than silently attached to the wrong switch.
    assert.equal(featureForKind("broadcast"), null);
    assert.equal(featureForKind("nonsense"), null);
  });

  it("only ever names a real feature", () => {
    for (const kind of ["confirmation", "reminder_24h", "followup"]) {
      assert.ok(SWITCHABLE_FEATURES.includes(featureForKind(kind)!), kind);
    }
  });
});

describe("isFeatureOn", () => {
  it("is off only when something explicitly said so", () => {
    assert.equal(isFeatureOn({ reminders: false }, "reminders"), false);
    assert.equal(isFeatureOn({ reminders: true }, "reminders"), true);
  });

  it("treats absence as on, so a missing row never silences a clinic", () => {
    assert.equal(isFeatureOn({}, "reminders"), true);
    assert.equal(isFeatureOn({ other: false }, "reminders"), true);
    assert.equal(isFeatureOn({}, null), true);
    assert.equal(isFeatureOn({}, "a_feature_that_does_not_exist"), true);
  });

  it("does not let an unmapped kind be switched off by accident", () => {
    assert.equal(isKindOn({ broadcast: false } as never, "broadcast"), true);
  });

  it("switches a kind off through its feature", () => {
    assert.equal(isKindOn({ reminders: false }, "reminder_24h"), false);
    assert.equal(isKindOn({ reminders: false }, "confirmation"), true);
  });
});

describe("loadFeatureSwitches", () => {
  it("reads the rows into a lookup", async () => {
    const db = createFakeDb({
      tables: {
        notification_feature_switches: [
          { feature_key: "reminders", enabled: false },
          { feature_key: "confirmations", enabled: true },
        ],
      },
    });
    assert.deepEqual(await loadFeatureSwitches(db as never), {
      reminders: false,
      confirmations: true,
    });
  });

  it("returns nothing — meaning everything on — when the read fails", async () => {
    const db = createFakeDb({
      failOn: { "notification_feature_switches.select": { message: "boom" } },
    });
    assert.deepEqual(await loadFeatureSwitches(db as never), {});
  });
});

describe("setFeatureSwitch", () => {
  it("upserts on the feature key", async () => {
    const db = createFakeDb();
    assert.equal(await setFeatureSwitch(db as never, "reminders", false), true);
    const [write] = db.upsertsTo("notification_feature_switches");
    assert.equal(write.values.feature_key, "reminders");
    assert.equal(write.values.enabled, false);
  });

  it("reports failure rather than throwing", async () => {
    const db = createFakeDb({
      failOn: { "notification_feature_switches.upsert": { message: "no" } },
    });
    assert.equal(await setFeatureSwitch(db as never, "reminders", false), false);
  });
});
