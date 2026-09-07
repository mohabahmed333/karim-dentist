import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's strip-types runner requires the explicit extension.
import {
  caseStudyDetailHref,
  collectCaseStudyDetailPageIds,
  collectFeaturedDetailPageIds,
  featuredDetailHref,
  toDetailPageIdSet,
} from "./detailPageLink.ts";

test("builds featured href when slug and sections exist", () => {
  const ids = toDetailPageIdSet(["fp-1"]);
  assert.equal(
    featuredDetailHref({ id: "fp-1", slug: "voi" }, ids),
    "/featured/voi",
  );
});

test("returns null when featured project has no detail page", () => {
  const ids = toDetailPageIdSet(["fp-1"]);
  assert.equal(
    featuredDetailHref({ id: "fp-2", slug: "voi-alt" }, ids),
    null,
  );
  assert.equal(featuredDetailHref({ id: "fp-1", slug: null }, ids), null);
});

test("builds case study href when slug and sections exist", () => {
  const ids = toDetailPageIdSet(["cs-1"]);
  assert.equal(
    caseStudyDetailHref({ id: "cs-1", slug: "voi-film" }, ids),
    "/case-studies/voi-film",
  );
});

test("returns null in customize preview mode", () => {
  const ids = toDetailPageIdSet(["cs-1"]);
  assert.equal(
    caseStudyDetailHref({ id: "cs-1", slug: "voi-film" }, ids, true),
    null,
  );
});

test("includes slugged case studies even when the page has no sections yet", () => {
  const ids = collectCaseStudyDetailPageIds(
    [{ id: "cs-1", slug: "hero-reel-frame" }],
    {},
  );
  assert.deepEqual(ids, ["cs-1"]);
  assert.equal(
    caseStudyDetailHref({ id: "cs-1", slug: "hero-reel-frame" }, toDetailPageIdSet(ids)),
    "/case-studies/hero-reel-frame",
  );
});

test("includes slugged featured projects even when the page has no sections yet", () => {
  const ids = collectFeaturedDetailPageIds(
    [{ id: "fp-1", slug: "voi-alt" }],
    {},
  );
  assert.deepEqual(ids, ["fp-1"]);
});
