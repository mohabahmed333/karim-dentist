import { describe, expect, it } from "vitest";
import {
  groupServicesByKind,
  hasVisibleServiceTitle,
  resolveServiceKindTitle,
} from "./serviceKindGroups";

describe("resolveServiceKindTitle", () => {
  it("uses localized labels when provided", () => {
    expect(
      resolveServiceKindTitle("our_services", {
        our_services: "خدماتنا",
        laser: "علاجات الليزر",
      }),
    ).toBe("خدماتنا");
    expect(
      resolveServiceKindTitle("laser", {
        our_services: "خدماتنا",
        laser: "علاجات الليزر",
      }),
    ).toBe("علاجات الليزر");
  });

  it("falls back to English defaults", () => {
    expect(resolveServiceKindTitle("our_services")).toBe("Our Services");
    expect(resolveServiceKindTitle("laser")).toBe("Laser treatments");
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

    expect(groups.map((g) => g.title)).toEqual([
      "خدماتنا",
      "علاجات الليزر",
    ]);
  });
});

describe("hasVisibleServiceTitle", () => {
  it("hides empty and placeholder titles", () => {
    expect(hasVisibleServiceTitle("")).toBe(false);
    expect(hasVisibleServiceTitle("   ")).toBe(false);
    expect(hasVisibleServiceTitle("Untitled")).toBe(false);
    expect(hasVisibleServiceTitle("بدون عنوان")).toBe(false);
    expect(hasVisibleServiceTitle("Dental laser treatments")).toBe(true);
  });
});
