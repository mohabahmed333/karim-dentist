import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's strip-types runner requires the explicit extension.
import { caseStudyPath } from "./caseStudyPath.ts";

test("builds a public case-study path from a slug", () => {
  assert.equal(caseStudyPath("deep-space"), "/case-studies/deep-space");
});

test("returns null when the case study has no slug", () => {
  assert.equal(caseStudyPath(null), null);
  assert.equal(caseStudyPath(""), null);
});
