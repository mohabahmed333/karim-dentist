import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { contactCredentialsLines } from "./contactCredentialsLines";

describe("contactCredentialsLines", () => {
  it("splits trimmed non-empty lines", () => {
    assert.deepEqual(contactCredentialsLines(
        "Mastership Laser Dentistry - Aachen, Germany\n\nMembership of American dental association of cosmetic dentistry\n",
      ), [
      "Mastership Laser Dentistry - Aachen, Germany",
      "Membership of American dental association of cosmetic dentistry",
    ]);
  });

  it("returns empty for blank input", () => {
    assert.deepEqual(contactCredentialsLines(""), []);
    assert.deepEqual(contactCredentialsLines(null), []);
  });
});
