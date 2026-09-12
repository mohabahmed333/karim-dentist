import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { DEFAULT_SETTINGS_TAB, SETTINGS_TABS, settingsTabParser } from "./settingsTabs.ts";

describe("settings tab in the URL", () => {
  it("names every tab with a readable slug", () => {
    assert.deepEqual(
      [...SETTINGS_TABS],
      ["dashboard", "clinic-hours", "site", "clinic-prices", "whatsapp-ai", "patient-notifications"],
    );
    assert.equal(DEFAULT_SETTINGS_TAB, "dashboard");
  });

  it("reopens the tab named in ?tab= after a refresh", () => {
    for (const tab of SETTINGS_TABS) {
      assert.equal(settingsTabParser.parseServerSide(tab), tab);
    }
  });

  it("falls back to the dashboard for a missing, empty or unknown tab", () => {
    // An old bookmark or a typo must still open Settings, not a blank page.
    assert.equal(settingsTabParser.parseServerSide(undefined), "dashboard");
    assert.equal(settingsTabParser.parseServerSide(""), "dashboard");
    assert.equal(settingsTabParser.parseServerSide("hours"), "dashboard");
    assert.equal(settingsTabParser.parseServerSide("nonsense"), "dashboard");
  });

  it("uses the first value when the param is repeated", () => {
    assert.equal(settingsTabParser.parseServerSide(["site", "clinic-hours"]), "site");
  });

  it("writes the slug into the URL unchanged", () => {
    assert.equal(settingsTabParser.serialize("patient-notifications"), "patient-notifications");
  });

  it("replaces history, keeps the scroll position, and drops the default from the URL", () => {
    // Replace, so Back leaves Settings instead of stepping through every tab
    // clicked; no scroll jump on switch; plain /admin/settings for Dashboard.
    assert.equal(settingsTabParser.history, "replace");
    assert.equal(settingsTabParser.scroll, false);
    assert.equal(settingsTabParser.clearOnDefault, true);
  });
});
