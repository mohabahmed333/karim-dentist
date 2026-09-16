import assert from "node:assert/strict";
import { describe, it } from "node:test";
// @ts-expect-error -- Node strip-types needs the extension.
import {
  allDestinations,
  destinationLine,
  primaryDestinations,
} from "./destinations.ts";

const m = (kind: string, value: string, is_primary = false) =>
  ({ kind, value, is_primary }) as never;

describe("primaryDestinations", () => {
  it("takes one per kind, InstaPay first", () => {
    assert.deepEqual(
      primaryDestinations([
        m("wallet", "01000000001", true),
        m("instapay", "clinic@instapay", true),
        m("wallet", "01000000002"),
      ]),
      ["clinic@instapay", "01000000001"],
    );
  });

  it("falls back to the first of a kind when none is primary", () => {
    assert.deepEqual(
      primaryDestinations([m("wallet", "01000000009")]),
      ["01000000009"],
    );
  });

  it("joins into one line for the message", () => {
    assert.equal(
      destinationLine([
        m("instapay", "clinic@instapay", true),
        m("wallet", "01000000001", true),
      ]),
      "clinic@instapay — 01000000001",
    );
  });

  it("is empty when nothing is configured", () => {
    assert.deepEqual(primaryDestinations([]), []);
    assert.equal(destinationLine([]), "");
  });

  it("ignores blank values", () => {
    assert.deepEqual(primaryDestinations([m("wallet", "   ", true)]), []);
  });
});

describe("allDestinations", () => {
  it("keeps every active number, not just the primaries", () => {
    // A patient who paid to last year's wallet has still paid the clinic.
    assert.deepEqual(
      allDestinations([
        m("wallet", "01000000001", true),
        m("wallet", "01000000002"),
        m("instapay", "clinic@instapay", true),
      ]),
      ["01000000001", "01000000002", "clinic@instapay"],
    );
  });
});
