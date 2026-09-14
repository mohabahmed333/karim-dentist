import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { filterAdminNavSections, type AdminNavSection } from "./adminNav";

const nestedFixture: AdminNavSection[] = [
  {
    id: "test-section",
    titleKey: "admin.nav.clinic",
    entries: [
      { href: "/admin/a", labelKey: "admin.nav.overview" },
      {
        id: "group-a",
        labelKey: "admin.nav.overview",
        items: [
          { href: "/admin/b", labelKey: "admin.nav.overview", permission: "b.view" },
          {
            id: "group-a-sub",
            labelKey: "admin.nav.overview",
            items: [
              { href: "/admin/c", labelKey: "admin.nav.overview", permission: "c.view" },
            ],
          },
        ],
      },
    ],
  },
];

describe("filterAdminNavSections (recursive)", () => {
  it("keeps every level unchanged when permissions is null (fails open)", () => {
    const result = filterAdminNavSections(nestedFixture, null);
    assert.deepEqual(result, nestedFixture);
  });

  it("collapses only the sub-group whose sole item is unpermitted, keeping the parent group", () => {
    const result = filterAdminNavSections(nestedFixture, new Set(["b.view"]));
    const groupA = result[0]!.entries!.find(
      (e) => "id" in e && e.id === "group-a",
    );
    assert.ok(groupA && "items" in groupA);
    assert.deepEqual(
      (groupA as { items: unknown[] }).items.map((i) => (i as { href: string }).href),
      ["/admin/b"],
    );
  });

  it("collapses a group two levels deep when nothing inside it is permitted", () => {
    const result = filterAdminNavSections(nestedFixture, new Set());
    const ids = result[0]!.entries!.map((e) => ("href" in e ? e.href : e.id));
    assert.deepEqual(ids, ["/admin/a"]);
  });
});
