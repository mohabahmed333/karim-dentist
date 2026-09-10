import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  dentalHeroBodyClass,
  dentalHeroContactChipClass,
  dentalHeroGridClass,
  dentalHeroHeadlineClass,
  dentalHeroMediaFrameClass,
  dentalHeroMediaShellClass,
  dentalHeroSectionClass,
} from "./dentalHeroLayout.ts";

test("mobile hero uses roomier horizontal padding than the default gutter", () => {
  assert.match(dentalHeroSectionClass, /\bpx-5\b/);
  assert.match(dentalHeroSectionClass, /lg:px-\[var\(--page-gutter\)\]/);
});

test("mobile headline stays full-width and softer than the desktop stack", () => {
  assert.match(dentalHeroHeadlineClass, /max-w-none/);
  assert.match(dentalHeroHeadlineClass, /lg:max-w-\[11ch\]/);
  assert.match(dentalHeroHeadlineClass, /clamp\(1\.95rem/);
});

test("mobile media fills leftover fold space in a flex column", () => {
  assert.match(dentalHeroGridClass, /\bflex\b/);
  assert.match(dentalHeroGridClass, /lg:grid/);
  assert.match(dentalHeroMediaShellClass, /flex-1/);
  assert.match(dentalHeroMediaShellClass, /min-h-\[18rem\]/);
});

test("mobile media frame uses a tighter radius", () => {
  assert.match(dentalHeroMediaFrameClass, /rounded-\[22px\]/);
});

test("contact chip stays desktop-only so mobile has one primary CTA", () => {
  assert.match(dentalHeroContactChipClass, /\bhidden\b/);
  assert.match(dentalHeroContactChipClass, /lg:inline-flex/);
});

test("body-to-cta gap is tighter on mobile", () => {
  assert.match(dentalHeroBodyClass, /\bmb-4\b/);
});
