import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  isLocale,
  localePath,
  localizeMixedHref,
  mirrorPath,
  stripLocale,
} from "./localePath.ts";

test("isLocale accepts only en and ar", () => {
  assert.equal(isLocale("en"), true);
  assert.equal(isLocale("ar"), true);
  assert.equal(isLocale("fr"), false);
  assert.equal(isLocale(""), false);
});

test("localePath leaves English canonical (no prefix)", () => {
  assert.equal(localePath("en", "/"), "/");
  assert.equal(localePath("en", "/case-studies"), "/case-studies");
});

test("localePath prefixes Arabic paths with /ar", () => {
  assert.equal(localePath("ar", "/"), "/ar");
  assert.equal(localePath("ar", "/case-studies"), "/ar/case-studies");
  assert.equal(
    localePath("ar", "/case-studies/example"),
    "/ar/case-studies/example",
  );
});

test("localePath preserves a hash fragment", () => {
  assert.equal(localePath("ar", "/#services"), "/ar#services");
  assert.equal(localePath("en", "/#services"), "/#services");
});

test("stripLocale reads /ar prefixes back off a pathname", () => {
  assert.deepEqual(stripLocale("/ar/case-studies"), {
    locale: "ar",
    path: "/case-studies",
  });
  assert.deepEqual(stripLocale("/ar"), { locale: "ar", path: "/" });
});

test("stripLocale treats an unprefixed path as English", () => {
  assert.deepEqual(stripLocale("/case-studies"), {
    locale: "en",
    path: "/case-studies",
  });
  assert.deepEqual(stripLocale("/"), { locale: "en", path: "/" });
});

test("mirrorPath swaps the locale of a pathname while keeping the page", () => {
  assert.equal(mirrorPath("/case-studies", "ar"), "/ar/case-studies");
  assert.equal(mirrorPath("/ar/case-studies", "en"), "/case-studies");
  assert.equal(mirrorPath("/ar", "en"), "/");
  assert.equal(mirrorPath("/", "ar"), "/ar");
});

test("localizeMixedHref prefixes an internal path but leaves a hash alone", () => {
  assert.equal(localizeMixedHref("ar", "/gallery"), "/ar/gallery");
  assert.equal(localizeMixedHref("ar", "#gallery"), "#gallery");
});

test("localizeMixedHref never touches an absolute URL", () => {
  assert.equal(
    localizeMixedHref("ar", "https://wa.me/201111922252"),
    "https://wa.me/201111922252",
  );
});

test("localizeMixedHref is a no-op for English", () => {
  assert.equal(localizeMixedHref("en", "/gallery"), "/gallery");
});
