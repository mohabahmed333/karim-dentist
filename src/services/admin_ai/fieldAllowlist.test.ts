import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  CMS_SINGLETONS,
  assertAllowedFields,
  pickAllowedFields,
} from "./fieldAllowlist.ts";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildDiff, changedKeys } from "./diff.ts";

describe("fieldAllowlist", () => {
  it("picks only allowlisted fields", () => {
    const picked = pickAllowedFields(CMS_SINGLETONS.hero, {
      title: "New",
      evil: "nope",
      subtitle: "Sub",
    });
    assert.deepEqual(picked, { title: "New", subtitle: "Sub" });
  });

  it("rejects unknown fields when asserting", () => {
    assert.throws(() =>
      assertAllowedFields(CMS_SINGLETONS.about, { body: "ok", hack: 1 }),
    );
  });
});

describe("diff", () => {
  it("builds action diffs and lists changed keys", () => {
    const diff = buildDiff({
      action: {
        id: "1",
        kind: "cms.update_singleton",
        label: "Hero",
        dependsOn: [],
        payload: {},
      },
      target: "hero",
      before: { title: "Old" },
      after: { title: "New" },
    });
    assert.equal(diff.target, "hero");
    assert.deepEqual(changedKeys(diff.before, diff.after), ["title"]);
  });
});
