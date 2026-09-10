import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { resolvePublicRewrite } from "./publicRewrite.ts";

test("rewrites the bare homepage to the default locale segment", () => {
  assert.equal(resolvePublicRewrite("/"), "/en");
});

test("rewrites a public route to the default locale segment", () => {
  assert.equal(resolvePublicRewrite("/case-studies"), "/en/case-studies");
  assert.equal(
    resolvePublicRewrite("/case-studies/laser-gum-contouring"),
    "/en/case-studies/laser-gum-contouring",
  );
  assert.equal(resolvePublicRewrite("/featured"), "/en/featured");
});

test("leaves /ar and its subpaths untouched — they already match [locale]", () => {
  assert.equal(resolvePublicRewrite("/ar"), null);
  assert.equal(resolvePublicRewrite("/ar/case-studies"), null);
});

test("leaves /en untouched at the proxy layer — the redirect config owns that", () => {
  assert.equal(resolvePublicRewrite("/en"), null);
  assert.equal(resolvePublicRewrite("/en/case-studies"), null);
});

test("never rewrites admin, api, or showreel routes", () => {
  for (const path of [
    "/admin",
    "/admin/login",
    "/admin/case-studies",
    "/api/v1/booking",
    "/showreel",
    "/showreel/demo",
    "/showreel2",
  ]) {
    assert.equal(resolvePublicRewrite(path), null, path);
  }
});

test("never rewrites Next internals or well-known special files", () => {
  for (const path of [
    "/_next/static/chunks/main.js",
    "/_vercel/insights",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.webmanifest",
    "/llms.txt",
    "/llms-full.txt",
    "/favicon.ico",
    "/icon.png",
  ]) {
    assert.equal(resolvePublicRewrite(path), null, path);
  }
});

test("never rewrites a path that looks like a static asset", () => {
  assert.equal(resolvePublicRewrite("/hero.mp4"), null);
  assert.equal(resolvePublicRewrite("/dental/logo.jpg"), null);
});
