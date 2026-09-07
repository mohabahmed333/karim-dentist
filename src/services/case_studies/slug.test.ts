import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's strip-types runner requires the explicit extension.
import { isBlankSlug, slugifyTitle, withEnsuredSlug } from "./slug.ts";

test("treats null and empty slugs as missing so customize saves can generate one", () => {
  assert.equal(isBlankSlug(null), true);
  assert.equal(isBlankSlug(""), true);
  assert.equal(isBlankSlug("   "), true);
  assert.equal(isBlankSlug("voi-brand-film"), false);
});

test("slugifies titles for public case-study URLs", () => {
  assert.equal(slugifyTitle("Hero Reel Frame"), "hero-reel-frame");
});

test("fills a missing slug from the title so the public page can open", () => {
  const next = withEnsuredSlug(
    { title: "Hero Reel Frame", slug: null },
    { title: "Hero Reel Frame" },
  );
  assert.equal(next.slug, "hero-reel-frame");
});

test("leaves an existing slug unchanged", () => {
  const partial = { title: "VOI Brand Film" };
  const next = withEnsuredSlug(
    { title: "VOI", slug: "voi-brand-film" },
    partial,
  );
  assert.equal(next, partial);
  assert.equal(next.slug, undefined);
});
