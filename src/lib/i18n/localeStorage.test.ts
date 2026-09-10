import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { localeBootstrapScriptHtml } from "./localeStorage.ts";

test("does not emit bootstrap HTML on client-exclusive renders", () => {
  assert.equal(localeBootstrapScriptHtml("client"), null);
});

test("emits the locale IIFE on server renders", () => {
  const html = localeBootstrapScriptHtml("server");
  assert.ok(html);
  assert.match(html, /document\.documentElement\.lang/);
  assert.match(html, /dental-lounge-locale/);
});

test("showreel demo bootstrap forces English before paint", () => {
  const html = localeBootstrapScriptHtml("server");
  assert.ok(html);
  assert.match(html, /\/showreel\/demo/);
  assert.match(html, /lang="en"/);
});
