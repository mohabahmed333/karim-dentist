import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  caseStudyDetailHref,
  collectCaseStudyDetailPageIds,
  collectFeaturedDetailPageIds,
  featuredDetailHref,
  toDetailPageIdSet,
} from "./detailPageLink.ts";

test("homepage and index cards link when the item has a slug", () => {
  const caseIds = collectCaseStudyDetailPageIds([
    { id: "cs-1", slug: "voi-brand-film" },
    { id: "cs-2", slug: null },
  ]);
  const featuredIds = collectFeaturedDetailPageIds([
    { id: "fp-1", slug: "studio-portrait" },
    { id: "fp-2", slug: "   " },
  ]);
  assert.deepEqual(caseIds, ["cs-1"]);
  assert.deepEqual(featuredIds, ["fp-1"]);
  assert.equal(
    caseStudyDetailHref(
      { id: "cs-1", slug: "voi-brand-film" },
      toDetailPageIdSet(caseIds),
    ),
    "/case-studies/voi-brand-film",
  );
  assert.equal(
    featuredDetailHref(
      { id: "fp-1", slug: "studio-portrait" },
      toDetailPageIdSet(featuredIds),
    ),
    "/featured/studio-portrait",
  );
});

test("customize preview never navigates away from the editor canvas", () => {
  const ids = toDetailPageIdSet(["cs-1", "fp-1"]);
  assert.equal(
    caseStudyDetailHref({ id: "cs-1", slug: "voi" }, ids, true),
    null,
  );
  assert.equal(
    featuredDetailHref({ id: "fp-1", slug: "voi" }, ids, true),
    null,
  );
});

test("blank slug cards stay static until a slug is generated", () => {
  const ids = toDetailPageIdSet(["cs-1"]);
  assert.equal(
    caseStudyDetailHref({ id: "cs-1", slug: null }, ids),
    null,
  );
});
