import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  groupServicesByKind,
  hasVisibleServiceTitle,
  resolveServiceKindTitle,
} from "./serviceKindGroups";

describe("resolveServiceKindTitle", () => {
  it("uses localized labels when provided", () => {
    assert.equal(resolveServiceKindTitle("our_services", {
        our_services: "خدماتنا",
        laser: "علاجات الليزر",
      }), "خدماتنا");
    assert.equal(resolveServiceKindTitle("laser", {
        our_services: "خدماتنا",
        laser: "علاجات الليزر",
      }), "علاجات الليزر");
  });

  it("falls back to English defaults", () => {
    assert.equal(resolveServiceKindTitle("our_services"), "Our Services");
    assert.equal(resolveServiceKindTitle("laser"), "Laser treatments");
  });
});

describe("groupServicesByKind", () => {
  it("applies localized group titles", () => {
    const groups = groupServicesByKind(
      [
        { kind: "our_services", sort_order: 1, title: "A" },
        { kind: "laser", sort_order: 2, title: "B" },
      ],
      {
        our_services: "خدماتنا",
        laser: "علاجات الليزر",
      },
    );

    assert.deepEqual(groups.map((g) => g.title), [
      "خدماتنا",
      "علاجات الليزر",
    ]);
  });
});

describe("hasVisibleServiceTitle", () => {
  it("hides empty and placeholder titles", () => {
    assert.equal(hasVisibleServiceTitle(""), false);
    assert.equal(hasVisibleServiceTitle("   "), false);
    assert.equal(hasVisibleServiceTitle("Untitled"), false);
    assert.equal(hasVisibleServiceTitle("بدون عنوان"), false);
    assert.equal(hasVisibleServiceTitle("Dental laser treatments"), true);
  });
});
