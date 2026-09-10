import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { resolveSiteUrl } from "./siteUrl.ts";

test("prefers NEXT_PUBLIC_SITE_URL when set", () => {
  assert.equal(
    resolveSiteUrl({ siteUrl: "https://thedentallounge.com" }),
    "https://thedentallounge.com",
  );
});

test("strips a trailing slash so joins never double up", () => {
  assert.equal(
    resolveSiteUrl({ siteUrl: "https://thedentallounge.com/" }),
    "https://thedentallounge.com",
  );
});

test("adds https when the configured origin has no protocol", () => {
  assert.equal(
    resolveSiteUrl({ siteUrl: "thedentallounge.com" }),
    "https://thedentallounge.com",
  );
});

test("falls back to the Vercel deployment URL on previews", () => {
  assert.equal(
    resolveSiteUrl({ vercelUrl: "karim-dentist-abc123.vercel.app" }),
    "https://karim-dentist-abc123.vercel.app",
  );
});

test("ignores a blank NEXT_PUBLIC_SITE_URL and keeps looking", () => {
  assert.equal(
    resolveSiteUrl({ siteUrl: "   ", vercelUrl: "preview.vercel.app" }),
    "https://preview.vercel.app",
  );
});

test("falls back to localhost when nothing is configured", () => {
  assert.equal(resolveSiteUrl({}), "http://localhost:3000");
});

test("keeps localhost on http so local canonicals resolve", () => {
  assert.equal(
    resolveSiteUrl({ siteUrl: "localhost:3000" }),
    "http://localhost:3000",
  );
});

test("prefers the stable production host over a per-deployment preview host", () => {
  assert.equal(
    resolveSiteUrl({
      productionUrl: "thedentallounge.vercel.app",
      vercelUrl: "karim-dentist-xyz789.vercel.app",
    }),
    "https://thedentallounge.vercel.app",
  );
});

test("an explicit site url outranks every Vercel host", () => {
  assert.equal(
    resolveSiteUrl({
      siteUrl: "https://thedentallounge.com",
      productionUrl: "thedentallounge.vercel.app",
      vercelUrl: "preview.vercel.app",
    }),
    "https://thedentallounge.com",
  );
});
