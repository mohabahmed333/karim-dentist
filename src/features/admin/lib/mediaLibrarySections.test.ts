import { describe, expect, it } from "vitest";
import {
  bucketsForMediaSection,
  mediaSectionFromBucket,
} from "./mediaLibrarySections";

describe("mediaLibrarySections", () => {
  it("maps all to every public bucket", () => {
    expect(bucketsForMediaSection("all")).toEqual([
      "hero",
      "about",
      "projects",
      "clients",
    ]);
  });

  it("maps a section to a single bucket", () => {
    expect(bucketsForMediaSection("about")).toEqual(["about"]);
  });

  it("defaults picker bucket to matching section tab", () => {
    expect(mediaSectionFromBucket("projects")).toBe("projects");
    expect(mediaSectionFromBucket("patient-records")).toBe("all");
  });
});
