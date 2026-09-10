import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { extractClientIp } from "./clientIp.ts";

test("prefers the first address in x-forwarded-for (the original client)", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2",
  });
  assert.equal(extractClientIp(headers), "203.0.113.7");
});

test("trims whitespace around the first address", () => {
  const headers = new Headers({ "x-forwarded-for": "  203.0.113.7  , 10.0.0.1" });
  assert.equal(extractClientIp(headers), "203.0.113.7");
});

test("falls back to x-real-ip when x-forwarded-for is absent", () => {
  const headers = new Headers({ "x-real-ip": "198.51.100.4" });
  assert.equal(extractClientIp(headers), "198.51.100.4");
});

test("falls back to a stable placeholder when nothing is present", () => {
  const headers = new Headers();
  assert.equal(extractClientIp(headers), "unknown");
});

test("ignores a blank x-forwarded-for value", () => {
  const headers = new Headers({ "x-forwarded-for": "" });
  assert.equal(extractClientIp(headers), "unknown");
});
