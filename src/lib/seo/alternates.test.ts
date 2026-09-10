import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { buildAlternates } from "./alternates.ts";

const SITE = "https://thedentallounge.com";

test("English page self-references as canonical, in the languages map too", () => {
  const alt = buildAlternates("en", "/case-studies/x", SITE);
  assert.equal(alt.canonical, "https://thedentallounge.com/case-studies/x");
  assert.deepEqual(alt.languages, {
    en: "https://thedentallounge.com/case-studies/x",
    ar: "https://thedentallounge.com/ar/case-studies/x",
    "x-default": "https://thedentallounge.com/case-studies/x",
  });
});

test("Arabic page self-references as canonical, but the languages map is identical either way", () => {
  const alt = buildAlternates("ar", "/case-studies/x", SITE);
  assert.equal(alt.canonical, "https://thedentallounge.com/ar/case-studies/x");
  assert.deepEqual(alt.languages, {
    en: "https://thedentallounge.com/case-studies/x",
    ar: "https://thedentallounge.com/ar/case-studies/x",
    "x-default": "https://thedentallounge.com/case-studies/x",
  });
});

test("handles the homepage path correctly for both locales", () => {
  assert.equal(buildAlternates("en", "/", SITE).canonical, "https://thedentallounge.com/");
  assert.equal(buildAlternates("ar", "/", SITE).canonical, "https://thedentallounge.com/ar");
});
