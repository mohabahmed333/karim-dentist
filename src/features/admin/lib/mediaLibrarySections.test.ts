import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bucketsForMediaSection,
  mediaSectionFromBucket,
} from "./mediaLibrarySections";

describe("mediaLibrarySections", () => {
  it("maps all to every public bucket", () => {
    assert.deepEqual(bucketsForMediaSection("all"), [
      "hero",
      "about",
      "projects",
      "clients",
    ]);
  });

  it("maps a section to a single bucket", () => {
    assert.deepEqual(bucketsForMediaSection("about"), ["about"]);
  });

  it("defaults picker bucket to matching section tab", () => {
    assert.equal(mediaSectionFromBucket("projects"), "projects");
    assert.equal(mediaSectionFromBucket("patient-records"), "all");
  });
});
