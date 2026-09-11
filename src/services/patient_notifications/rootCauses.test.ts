import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { rootCauses } from "./rootCauses.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { NO_TEMPLATE_LABEL } from "./featureConditions.ts";

const cond = (key: string, met: boolean | null, label = key) => ({ key, label, met, why: `why ${key}`, fix: `fix ${key}` });
const feature = (title: string, conditions: ReturnType<typeof cond>[]) => ({ key: title, title, conditions });

describe("rootCauses", () => {
  it("lists a shared cause once, with every feature it blocks", () => {
    const out = rootCauses([
      feature("Confirmations", [cond("migrations", false)]),
      feature("Reminders", [cond("migrations", false)]),
    ]);
    assert.equal(out.length, 1);
    assert.deepEqual(out[0].features, ["Confirmations", "Reminders"]);
  });

  it("puts the cause blocking the most features first", () => {
    const out = rootCauses([
      feature("A", [cond("mode_send", false), cond("migrations", false)]),
      feature("B", [cond("migrations", false)]),
    ]);
    assert.deepEqual(out.map((c: { key: string }) => c.key), ["migrations", "mode_send"]);
  });

  it("ranks real blockers above things that only need a manual check", () => {
    const out = rootCauses([
      feature("A", [cond("scheduler", null)]),
      feature("B", [cond("scheduler", null)]),
      feature("C", [cond("knowledge_entries", false)]),
    ]);
    assert.deepEqual(out.map((c: { key: string }) => c.key), ["knowledge_entries", "scheduler"]);
    assert.equal(out[1].met, null);
  });

  it("merges every missing template into one cause instead of six", () => {
    // Six message types with no template are one fix — submitting templates —
    // not six separate problems competing for attention.
    const out = rootCauses([
      feature("Cancellations", [cond("template_cancellation", false, NO_TEMPLATE_LABEL)]),
      feature("Follow-ups", [cond("template_followup", false, NO_TEMPLATE_LABEL)]),
    ]);
    assert.equal(out.length, 1);
    assert.equal(out[0].key, "templates_missing");
    assert.match(out[0].fix, /Meta Business Manager/);
    assert.deepEqual(out[0].features, ["Cancellations", "Follow-ups"]);
  });

  it("keeps approved-but-pending templates separate, because they name real templates", () => {
    const out = rootCauses([
      feature("Confirmations", [cond("template_confirmation", false, "Templates approved in Meta: appoinment_en")]),
      feature("Cancellations", [cond("template_cancellation", false, NO_TEMPLATE_LABEL)]),
    ]);
    assert.deepEqual(out.map((c: { key: string }) => c.key).sort(), ["template_confirmation", "templates_missing"]);
  });

  it("ignores conditions that are met, and is empty when everything is", () => {
    assert.deepEqual(rootCauses([feature("A", [cond("migrations", true)])]), []);
  });

  it("does not list a feature twice for one cause", () => {
    const out = rootCauses([feature("Reviews", [cond("recall_switch", false), cond("recall_switch", false)])]);
    assert.deepEqual(out[0].features, ["Reviews"]);
  });
});
