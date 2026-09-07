import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  newCaseStudyDefaults,
  newFeaturedDefaults,
  newServiceDefaults,
} from "./collectionDefaults.ts";

test("new case studies are published so they appear on the public site", () => {
  assert.equal(newCaseStudyDefaults(3).is_published, true);
  assert.equal(newCaseStudyDefaults(3).sort_order, 3);
});

test("new featured projects are published so they appear on the public site", () => {
  assert.equal(newFeaturedDefaults(2).is_published, true);
});

test("new services are published so they appear on the public site", () => {
  assert.equal(newServiceDefaults(1).is_published, true);
  assert.deepEqual(newServiceDefaults(1).tags, []);
});
