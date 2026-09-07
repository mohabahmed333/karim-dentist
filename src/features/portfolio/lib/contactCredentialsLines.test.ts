import { describe, expect, it } from "vitest";
import { contactCredentialsLines } from "./contactCredentialsLines";

describe("contactCredentialsLines", () => {
  it("splits trimmed non-empty lines", () => {
    expect(
      contactCredentialsLines(
        "Mastership Laser Dentistry - Aachen, Germany\n\nMembership of American dental association of cosmetic dentistry\n",
      ),
    ).toEqual([
      "Mastership Laser Dentistry - Aachen, Germany",
      "Membership of American dental association of cosmetic dentistry",
    ]);
  });

  it("returns empty for blank input", () => {
    expect(contactCredentialsLines("")).toEqual([]);
    expect(contactCredentialsLines(null)).toEqual([]);
  });
});
