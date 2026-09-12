import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { starterPrompts } from "./starterPrompts.ts";

const t = (key: string) => key;

describe("starterPrompts", () => {
  it("offers patient-page prompts on a patient's own page", () => {
    const prompts = starterPrompts("/admin/patients/phone%3A20100", t);
    assert.ok(prompts.length > 0);
    assert.ok(prompts.every((p) => p.length > 0));
  });

  it("offers patient-page prompts inside the clinical workspace too", () => {
    const prompts = starterPrompts("/admin/patients/phone%3A20100/workspace", t);
    assert.ok(prompts.length > 0);
  });

  it("falls back to general prompts off a patient page", () => {
    const general = starterPrompts("/admin/dashboard", t);
    const onPatient = starterPrompts("/admin/patients/p1", t);
    assert.notDeepEqual(general, onPatient);
  });

  it("falls back to general prompts when the page is unknown", () => {
    assert.ok(starterPrompts(null, t).length > 0);
  });
});
