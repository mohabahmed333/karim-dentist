import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import { fdiFromArchPoint, universalFromArchPoint } from "./archPoint.ts";

describe("archPoint", () => {
  it("maps arch clicks to adult universal indices", () => {
    assert.equal(universalFromArchPoint({ x: 0, y: 0.2 }), 9);
    assert.equal(fdiFromArchPoint({ x: 0, y: 0.2 }), "21");
    const lower = universalFromArchPoint({ x: 3, y: -0.2 });
    assert.ok(lower != null && lower >= 17 && lower <= 32);
  });
});
