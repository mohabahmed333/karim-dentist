import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { parseLatLngFromText } from "./locationMap.ts";

describe("parseLatLngFromText", () => {
  it("parses plain lat,lng", () => {
    const p = parseLatLngFromText("30.0074, 31.4913");
    assert.ok(p);
    assert.equal(p.latitude, 30.0074);
    assert.equal(p.longitude, 31.4913);
  });

  it("parses Google Maps @lat,lng", () => {
    const p = parseLatLngFromText(
      "https://www.google.com/maps/@30.0074,31.4913,17z",
    );
    assert.ok(p);
    assert.equal(p.latitude, 30.0074);
  });
});
