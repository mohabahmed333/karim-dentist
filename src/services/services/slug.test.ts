import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node's strip-types runner requires the explicit extension.
import { isBlankSlug, slugifyTitle, withEnsuredSlug } from "./slug.ts";

test("treats null and empty slugs as missing so admin saves can generate one", () => {
  assert.equal(isBlankSlug(null), true);
  assert.equal(isBlankSlug(""), true);
  assert.equal(isBlankSlug("   "), true);
  assert.equal(isBlankSlug("teeth-whitening"), false);
});

test("slugifies titles for public service URLs", () => {
  assert.equal(slugifyTitle("Teeth Whitening (Laser)"), "teeth-whitening-laser");
});

test("fills a missing slug from the title so the public page can open", () => {
  const next = withEnsuredSlug(
    { title: "Teeth Whitening", slug: null },
    { title: "Teeth Whitening" },
  );
  assert.equal(next.slug, "teeth-whitening");
});

test("leaves an existing slug unchanged", () => {
  const partial = { title: "Teeth Whitening (Laser)" };
  const next = withEnsuredSlug(
    { title: "Teeth Whitening", slug: "teeth-whitening" },
    partial,
  );
  assert.equal(next, partial);
  assert.equal(next.slug, undefined);
});
